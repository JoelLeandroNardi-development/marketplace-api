import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class MarketplaceApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiFunction = new lambda.Function(this, 'MarketplaceApiFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('../../dist'),
      memorySize: 512,
      timeout: Duration.seconds(15),
      environment: {
        NODE_ENV: 'production',
      },
    });

    const api = new apigatewayv2.HttpApi(this, 'MarketplaceHttpApi', {
      defaultIntegration: new integrations.HttpLambdaIntegration(
        'MarketplaceApiIntegration',
        apiFunction,
      ),
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.url ?? 'unknown',
    });
  }
}
