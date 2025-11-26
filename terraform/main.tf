# Terraform自体の設定
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # AWSプロバイダーのバージョンを指定
    }
  }
}

# 使用するクラウドプロバイダー（AWS）の設定
provider "aws" {
  region = "ap-northeast-1" # 東京リージョンを使用
}

# --- KMS Key for Encryption ---
resource "aws_kms_key" "encryption_key" {
  description             = "KMS key for encrypting Slack API tokens"
  deletion_window_in_days = 7
}

# --- DynamoDB Tables ---

# Usersテーブル
resource "aws_dynamodb_table" "users_table" {
  name         = "KANKAN-BS2-Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = {
    Name = "KANKAN-BS2-Users"
  }
}

# LabMembersテーブル
resource "aws_dynamodb_table" "lab_members_table" {
  name         = "KANKAN-BS2-LabMembers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "slackDmId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SlackDmIdIndex"
    hash_key        = "slackDmId"
    projection_type = "ALL"
  }

  tags = {
    Name = "KANKAN-BS2-LabMembers"
  }
}

# --- IAM Role for Lambda ---

# --- SSM Parameter for JWT Secret ---
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/KANKAN-BS2/JWT_SECRET"
  type  = "String" # 本番環境ではSecureStringを検討
  value = "dummy-secret-value-please-change-in-aws-console"
  tags = {
    Name = "KANKAN-BS2-JWT-Secret"
  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name               = "KANKAN-BS2-LambdaExecRole"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# --- IAM Policy for Lambda Access ---

data "aws_iam_policy_document" "lambda_access" {
  statement {
    sid = "DynamoDBAccess"
    actions = [
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem"
    ]
    resources = [
      aws_dynamodb_table.users_table.arn,
      aws_dynamodb_table.lab_members_table.arn,
      "${aws_dynamodb_table.users_table.arn}/index/*",
      "${aws_dynamodb_table.lab_members_table.arn}/index/*",
    ]
  }

  statement {
    sid = "KMSAccess"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt"
    ]
    resources = [
      aws_kms_key.encryption_key.arn
    ]
  }
}

resource "aws_iam_role_policy" "lambda_access_policy" {
  name   = "KANKAN-BS2-LambdaAccessPolicy"
  role   = aws_iam_role.lambda_exec_role.id
  policy = data.aws_iam_policy_document.lambda_access.json
}

# --- Attach Basic Lambda Execution Policy for Logs ---

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Lambda Function ---

resource "aws_lambda_function" "api_lambda" {
  filename         = "../backend/deployment_package.zip"
  function_name    = "KANKAN-BS2-API"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "dist/presentation/server.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  source_code_hash = filebase64sha256("../backend/deployment_package.zip")

  environment {
    variables = {
      DYNAMODB_TABLE_USERS   = aws_dynamodb_table.users_table.name
      DYNAMODB_TABLE_MEMBERS = aws_dynamodb_table.lab_members_table.name
      KMS_KEY_ID             = aws_kms_key.encryption_key.id
      JWT_SECRET             = aws_ssm_parameter.jwt_secret.value
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_access_policy,
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]
}

# --- API Gateway (HTTP API) ---

resource "aws_apigatewayv2_api" "http_api" {
  name          = "KANKAN-BS2-HTTP-API"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# --- Outputs ---

output "api_endpoint_url" {
  description = "The URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_stage.default_stage.invoke_url
}
