
# Service Invoicing

AWS Lambda project to process invoicing. It may include third-party integrations.

## install

1)  npm install

2)



## Usage

Create a `.secrets.[env].json` at the root level of the project. Make sure `env` points to the right environment stage `dev`, `uat`, or `prod`. You can use the file `secrets.sample.json` as a starting point.

### Deployment

In order to deploy the service, you need to run the following command:

```bash
serverless deploy
```

After running deploy, you should see output similar to:

```bash
Deploying invoicing to stage dev (us-east-1)
✔ Pruning of functions complete

✔ Service deployed to stack invoicing-dev (152s)

endpoints:
   
functions:
 
```

### Invocation

After successful deployment, you can invoke the deployed function by using the following command:

```bash
serverless invoke --function createInvoice
```

### Local invocation

You can invoke your function locally by using the following command:

```bash
 serverless invoke local --function pdf --path data.json
 serverless invoke local --function createToken --path data.json
 serverless invoke local --function createInvoice --path data.json

```