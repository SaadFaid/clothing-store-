-- Create payment_metadata table
CREATE TABLE payment_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_token TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_metadata
CREATE POLICY "Users can view their own payment metadata" ON payment_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.transaction_id = payment_metadata.payment_token
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own payment metadata" ON payment_metadata
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.transaction_id = payment_metadata.payment_token
      AND p.user_id = auth.uid()
    )
  );
