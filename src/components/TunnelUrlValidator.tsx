import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useGatewayUrlValidation } from '@/hooks/use-gateway-health';
import { cn } from '@/lib/utils';

interface TunnelUrlValidatorProps {
  onValidUrl?: (url: string) => void;
  currentUrl?: string;
}

export function TunnelUrlValidator({ onValidUrl, currentUrl }: TunnelUrlValidatorProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [testUrl, setTestUrl] = useState('');

  const { data: isValid, isLoading, error } = useGatewayUrlValidation(testUrl);

  const handleTest = () => {
    if (!inputUrl.trim()) return;
    
    let url = inputUrl.trim();
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    setTestUrl(url);
  };

  const handleUseUrl = () => {
    if (isValid && testUrl && onValidUrl) {
      onValidUrl(testUrl);
      setInputUrl('');
      setTestUrl('');
    }
  };

  const getValidationStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Testing connection...
        </div>
      );
    }

    if (error || (testUrl && isValid === false)) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <XCircle className="h-4 w-4" />
          Connection failed
        </div>
      );
    }

    if (testUrl && isValid === true) {
      return (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle className="h-4 w-4" />
          Connection successful
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Test Tunnel URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUrl && (
          <div>
            <Label className="text-sm font-medium">Current URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{currentUrl}</Badge>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="tunnel-url">New Tunnel URL</Label>
          <div className="flex gap-2">
            <Input
              id="tunnel-url"
              placeholder="your-tunnel.trycloudflare.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTest()}
            />
            <Button
              onClick={handleTest}
              disabled={!inputUrl.trim() || isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
            </Button>
          </div>
        </div>

        {testUrl && (
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Testing:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{testUrl}</code>
              </div>
              <div className="mt-2">
                {getValidationStatus()}
              </div>
            </div>

            {isValid && (
              <Button onClick={handleUseUrl} className="w-full">
                Use This URL
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Enter the new Cloudflare tunnel URL</p>
          <p>• The system will test the /health endpoint</p>
          <p>• Only validated URLs can be used</p>
        </div>
      </CardContent>
    </Card>
  );
}