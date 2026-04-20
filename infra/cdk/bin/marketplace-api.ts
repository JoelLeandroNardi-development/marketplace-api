#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MarketplaceApiStack } from '../lib/marketplace-api-stack';

const app = new cdk.App();

new MarketplaceApiStack(app, 'MarketplaceApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
