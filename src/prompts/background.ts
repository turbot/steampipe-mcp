import { Prompt } from "@modelcontextprotocol/sdk/types.js";

export const BACKGROUND_PROMPT = {
  name: "background",
  description: "Best practices for writing Steampipe SQL queries",
  content: [
    {
      type: "text",
      text: `When writing SQL queries for Steampipe, follow these essential best practices:

1. Use CTEs (WITH Clauses) Instead of JOINs
   - CTEs are more efficient than JOINs in Steampipe
   - Always use "AS MATERIALIZED" with CTEs to ensure proper execution
   - Example:
     WITH users AS MATERIALIZED (
       SELECT user_id, username
       FROM aws_iam_user
     )

2. Minimize CTE Usage
   - Only use CTEs when you need to join data
   - For simple queries, use direct SELECT statements
   - Bad:  WITH users AS MATERIALIZED (SELECT * FROM aws_iam_user)
   - Good: SELECT user_name, user_id FROM aws_iam_user

3. Column Selection
   - Always specify exact columns needed, avoid SELECT *
   - Each column adds API calls and increases query time
   - Bad:  SELECT * FROM aws_iam_user
   - Good: SELECT user_name, user_id FROM aws_iam_user

4. Use Information Schema
   - Query information_schema.columns for available columns
   - Don't guess column names
   - Example:
     SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'aws_iam_user'

5. Query Structure
   - Start with the most filtered table in CTEs
   - Use WHERE clauses early to reduce data transfer
   - Consider using LIMIT when exploring data

6. Performance Considerations
   - Each column access may trigger an API call
   - Filtering early reduces data transfer
   - Materialized CTEs cache results for reuse

Example of a well-structured query:
WITH active_users AS MATERIALIZED (
  SELECT user_id, user_name, arn
  FROM aws_iam_user
  WHERE tags ->> 'Environment' = 'Production'
),
user_policies AS MATERIALIZED (
  SELECT user_name, policy_name
  FROM aws_iam_user_policy
  WHERE policy_name LIKE 'Admin%'
)
SELECT 
  u.user_name,
  u.arn,
  p.policy_name
FROM active_users u
JOIN user_policies p USING (user_name);`
    }
  ]
} satisfies Prompt; 