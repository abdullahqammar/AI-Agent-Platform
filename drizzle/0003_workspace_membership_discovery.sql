CREATE POLICY agentflow_own_memberships ON business_memberships FOR SELECT
USING (
  nullif(current_setting('agentflow.business_id', true), '') IS NULL
  AND active
  AND user_id IN (SELECT id FROM users
    WHERE identity_issuer = current_setting('agentflow.identity_issuer', true)
      AND identity_subject = current_setting('agentflow.identity_subject', true))
);
