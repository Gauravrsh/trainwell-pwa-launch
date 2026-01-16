-- Best practice: Prevent deletion of payment records entirely for audit trail integrity
-- Financial records should never be deleted - use status updates instead (e.g., 'refunded', 'cancelled')

CREATE POLICY "Payment records cannot be deleted" ON payments
FOR DELETE USING (false);