import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/pricing');
    } else {
      setLoading(false);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
          <CardDescription>
            {loading ? 'Processing your subscription...' : 'Your subscription has been activated successfully.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                You now have access to all premium features. Thank you for subscribing!
              </p>
              <Button 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
