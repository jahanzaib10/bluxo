
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export function InvitationDebug() {
  const [token, setToken] = useState('bbe80526-f332-48d2-977b-cd1ffec5a28f');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testInvitationLookup = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('=== INVITATION DEBUG TEST ===');
      console.log('Testing token:', token);

      // Test 1: Get all invitations to see what's in the database
      const { data: allInvitations, error: allError } = await supabase
        .from('user_invitations')
        .select('*');

      console.log('All invitations:', allInvitations);
      console.log('All invitations error:', allError);

      // Test 2: Try the exact query that's failing
      const { data: tokenQuery, error: tokenError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null);

      console.log('Token query result:', tokenQuery);
      console.log('Token query error:', tokenError);

      // Test 3: Try without the accepted_at filter
      const { data: tokenOnlyQuery, error: tokenOnlyError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token);

      console.log('Token only query result:', tokenOnlyQuery);
      console.log('Token only query error:', tokenOnlyError);

      // Test 4: Check if the token exists with a different case or whitespace
      const { data: likeQuery, error: likeError } = await supabase
        .from('user_invitations')
        .select('*')
        .ilike('token', `%${token}%`);

      console.log('Like query result:', likeQuery);
      console.log('Like query error:', likeError);

      setResults({
        token,
        allInvitations: allInvitations || [],
        tokenQuery: tokenQuery || [],
        tokenOnlyQuery: tokenOnlyQuery || [],
        likeQuery: likeQuery || [],
        errors: {
          allError,
          tokenError,
          tokenOnlyError,
          likeError
        }
      });

    } catch (err) {
      console.error('Debug test error:', err);
      setResults({ error: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Invitation Debug Tool</CardTitle>
        <CardDescription>Test invitation token lookup functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="token">Token to Test</Label>
          <Input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter invitation token"
          />
        </div>
        
        <Button onClick={testInvitationLookup} disabled={loading}>
          {loading ? 'Testing...' : 'Run Debug Test'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
