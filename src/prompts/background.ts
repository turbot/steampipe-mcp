import { Prompt } from "@modelcontextprotocol/sdk/types.js";

export const BACKGROUND_PROMPT = {
  name: "background",
  description: "Best practices for writing Steampipe SQL queries",
  content: [
    {
      type: "text",
      text: `When writing SQL queries for Steampipe, follow these essential best practices:

1. Response Style
   - Always return a markdown table with the results of the query
   - Minimize explanation of the query
   - Only explain specific aspects of the query if they are non-obvious or particularly important
   - Don't explain your understanding of the request or how you crafted the query
   - Keep responses concise and focused on the data
   - Explain your thinking when reworking queries for an error

2. Use CTEs (WITH Clauses) Instead of joins
   - CTEs are more efficient than joins in Steampipe
   - Always use "as materialized" with CTEs to ensure proper execution
   - Example:
     with users as materialized (
       select user_id, username
       from aws_iam_user
     )
   - Only use CTEs when you need to join data
   - For simple queries, use direct select statements
   - Bad:  with users as materialized (select * from {table_name})
   - Good: select user_name, user_id from {table_name}

3. SQL syntax
   - Indent with 2 spaces
   - Use lowercase for keywords
   - Example:
     select 
       user_name,
       arn,
       create_date,
       tags ->> 'Environment' as environment
     from aws_iam_user
     order by create_date desc

4. Column Selection
   - Always specify exact columns needed, avoid select *
   - Each column adds API calls and increases query time
   - Bad:  select * from {table_name}
   - Good: select user_name, user_id from {table_name}

5. Use Information Schema
   - Never guess table or column names - always query the information schema
   - Never limit results when querying information_schema
   - Include descriptions from PostgreSQL comments when available
   
   To list available tables in a schema:
   select 
     t.table_schema,
     t.table_name,
     pg_catalog.obj_description(
       (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass, 
       'pg_class'
     ) as description
   from information_schema.tables t
   where 
     t.table_schema NOT IN ('information_schema', 'pg_catalog')
   order by t.table_schema, t.table_name;

   To get details about a specific table's columns:
   select 
     c.column_name,
     c.data_type,
     pg_catalog.col_description(
       (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass::oid,
       c.ordinal_position
     ) as description
   from information_schema.columns c
   where 
     c.table_schema = '{schema_name}'
     AND c.table_name = '{table_name}'
   order by c.ordinal_position;

6. Query Structure
   - Start with the most filtered table in CTEs
   - Use where clauses early to reduce data transfer
   - Consider using LIMIT when exploring data (except for information_schema queries)

7. Performance Considerations
   - Each column access may trigger an API call
   - Filtering early reduces data transfer
   - Materialized CTEs cache results for reuse

Example of a well-structured query:
WITH active_users as materialized (
  select user_id, user_name, arn
  from aws_iam_user
  where tags ->> 'Environment' = 'Production'
),
user_policies as materialized (
  select user_name, policy_name
  from aws_iam_user_policy
  where policy_name LIKE 'Admin%'
)
select 
  u.user_name,
  u.arn,
  p.policy_name
from active_users u
join user_policies p using (user_name)
order by u.user_name;`
    }
  ]
} satisfies Prompt; 