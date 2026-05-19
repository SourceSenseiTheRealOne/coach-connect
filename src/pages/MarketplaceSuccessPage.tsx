import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MarketplaceSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      navigate("/dashboard/marketplace");
    } else {
      setLoading(false);
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background geometric-pattern">
      <Card className="w-full max-w-md ed-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">
            Purchase Successful
          </CardTitle>
          <CardDescription>
            {loading
              ? "Confirming your purchase..."
              : "Your marketplace purchase was completed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                The seller has been notified. Seller payout is processed
                manually within 7 days.
              </p>
              <Button
                className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
                onClick={() => navigate("/dashboard/marketplace")}
              >
                Back to Marketplace
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
