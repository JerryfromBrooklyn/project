# Uppy Companion Deployment and Scaling on AWS

This document provides guidance on deploying the Uppy Companion server on AWS and configuring it for automatic scaling to handle varying user loads, including high-concurrency scenarios.

## What is Uppy Companion?

Uppy Companion is a server-side application that works with the Uppy client-side file uploader. Its primary functions include:

1.  **Enabling Remote File Sources:** Allows users to import files directly from cloud storage providers like Dropbox, Google Drive, Instagram, etc., without the files passing through the user's browser.
2.  **Server-Side S3 Operations:** Handles tasks like signing URLs for direct S3 uploads or multipart uploads when configured for direct integration (though using Companion for *signing* is often less recommended than a dedicated signing endpoint).
3.  **Acting as a Proxy:** Facilitates the transfer of files between remote sources (like Dropbox) and your backend storage (like AWS S3).

## How Companion Works with Dropbox Imports to S3

When a user imports files from a service like Dropbox:

1.  The user authenticates with the remote provider (e.g., Dropbox) via Companion.
2.  The user selects files/folders within the provider's interface presented by Companion.
3.  Companion server **downloads** the selected files directly from the remote provider's API (e.g., Dropbox API).
4.  Companion server **uploads** the downloaded files directly to your configured AWS S3 bucket.
5.  The data transfer happens **server-to-server**, bypassing the user's local machine and internet connection constraints after the initial selection.

## Deployment Options on AWS

You can deploy Companion on AWS using several methods, each offering different levels of control, cost structure, and scaling capabilities:

### 1. AWS Lambda + API Gateway (Serverless)

*   **Description:** Deploy Companion as a Node.js Lambda function exposed via API Gateway.
*   **Scaling:** Inherently auto-scaling. Lambda automatically handles concurrent requests by spinning up function instances. API Gateway also scales automatically.
*   **Pros:** Pay-per-use pricing, minimal operational overhead, managed scaling.
*   **Cons:** Potential cold starts, execution duration limits (15 min max), potential concurrency limits (adjustable). Best suited for variable workloads but might be costly for *sustained* high processing of large files due to duration billing.

### 2. Amazon ECS + AWS Fargate (Serverless Containers)

*   **Description:** Package Companion in a Docker container and run it using ECS with the Fargate launch type (no EC2 instances to manage).
*   **Scaling:** Configure ECS Service Auto Scaling based on metrics like CPU/Memory utilization or Application Load Balancer (ALB) request count per target.
*   **Pros:** Serverless container orchestration, scales container tasks directly, good balance of control and managed infrastructure.
*   **Cons:** Slightly more configuration than Lambda.

### 3. Amazon ECS + EC2 Auto Scaling Group (Containers on EC2)

*   **Description:** Run Companion containers on a cluster of EC2 instances managed by an Auto Scaling group and ECS.
*   **Scaling:** Requires two layers:
    *   **Service Auto Scaling:** Scales the number of Companion *tasks* based on metrics.
    *   **Cluster Auto Scaling (Capacity Provider):** Scales the number of *EC2 instances* in the cluster based on task resource needs.
*   **Pros:** Full control over underlying instances, potentially cheaper for sustained high load (using RIs/Savings Plans).
*   **Cons:** Most complex to manage (both task and instance scaling), responsible for EC2 patching/management.

### 4. AWS Elastic Beanstalk (Managed Environment)

*   **Description:** Deploy Companion as a Node.js application within an Elastic Beanstalk environment.
*   **Scaling:** Configure auto-scaling rules directly in the Elastic Beanstalk environment settings based on metrics like CPU, Network I/O, Latency, or Request Count.
*   **Pros:** Simplifies deployment and management of underlying resources (EC2, Auto Scaling, ALB).
*   **Cons:** Less granular control than raw EC2/ECS.

## Configuring Auto-Scaling

Key AWS components involved (excluding Lambda):

*   **Application Load Balancer (ALB):** Distributes traffic and provides scaling metrics (e.g., `RequestCountPerTarget`).
*   **Auto Scaling Policies:** Define rules based on CloudWatch metrics (CPU, Memory, Network, ALB requests) to trigger scaling actions (add/remove tasks or instances).
*   **CloudWatch Metrics:** The data source for scaling decisions.

Choose scaling metrics appropriate for Companion's workload. Since Companion primarily proxies data, **Network I/O** and **CPU Utilization** (for handling connections/streams) are often good indicators, alongside **ALB Request Count per Target**.

## Handling High Concurrency (e.g., 200 x 5GB Dropbox Imports)

Scaling Companion to handle extreme loads like 200 simultaneous 5GB imports (1TB total ingress from Dropbox, 1TB total egress to S3) is challenging but feasible with careful design:

*   **Aggressive AWS Scaling:** Configure your chosen deployment (likely ECS Fargate or EC2) to scale *very rapidly* based on demand. This requires setting low thresholds and fast scale-out policies. Provision adequate network bandwidth for instances/tasks.
*   **Dropbox API Limits (Critical Bottleneck):**
    *   Companion servers making hundreds of concurrent, large download requests to Dropbox will likely hit API rate limits.
    *   **Robust Error Handling:** Implement exponential backoff and retry logic within Companion or its interaction layer to handle throttling errors gracefully.
    *   **Throttling:** Expect performance to be limited more by Dropbox's ability to serve the data than by AWS's ability to scale (if configured correctly).
*   **Companion Resource Limits:** Ensure individual Companion instances/tasks have sufficient CPU, memory, and *especially* network throughput allocated.
*   **S3 Throughput:** Generally not a bottleneck if using diverse key prefixes, but monitor S3 performance metrics under extreme load.
*   **Cost:** Be prepared for significant peak compute costs on AWS to handle the scaled-out infrastructure.

## Cost Implications

*   **Compute:** The primary cost driver. Depends on the chosen service (Lambda invocations/duration, Fargate vCPU/memory hours, EC2 instance hours). Scaling significantly increases this during peak load.
*   **Data Transfer:**
    *   Data IN to AWS (from Dropbox to Companion): Generally **Free**.
    *   Data Transfer between Companion and S3 (same region): **Free**.
    *   Data OUT from AWS (if applicable): Standard egress rates apply (~$0.09/GB after free tier).
*   **Other Services:** Costs for ALB, API Gateway, CloudWatch (metrics, logs), etc.

## Conclusion

Auto-scaling Uppy Companion on AWS is achievable using services like Lambda, ECS Fargate, or EC2 Auto Scaling. While AWS infrastructure can be configured to handle massive concurrency, the practical limits for remote provider imports (like Dropbox) often lie with the external provider's API rate limits and performance. Designing for robust error handling, retries, and anticipating external bottlenecks is crucial for high-volume scenarios. Choosing the right deployment method depends on your expected load patterns, operational preferences, and cost sensitivity. 