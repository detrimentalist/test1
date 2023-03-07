This project uses SST to deploy a stack on AWS. For this to work you need:

* At least Node.js 14 and npm7 installed.
* An AWS account

Once you have your account set up, follow this guide to create an IAM user and access keys:
https://sst.dev/chapters/create-an-iam-user.html

When you have the access keys, follow this guide to install AWS CLI 
and set it up with your access keys:

https://sst.dev/chapters/configure-the-aws-cli.html

Once you have that set up you need to install the dependencies for this project, run
"npm install" in the project root.

When finished you can start the app locally using "npx sst dev", or deploy it using "npx sst deploy", 
check https://docs.sst.dev/quick-start for more!