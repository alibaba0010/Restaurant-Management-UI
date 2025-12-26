import { Button } from '../ui/button';
import { Chrome } from 'lucide-react';
import { AppleLogo } from '../icons/apple-logo';
import { FacebookLogo } from '../icons/facebook-logo';

export default function OauthButtons() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Button variant="outline" onClick={() => console.log('Google OAuth')}>
        <Chrome className="mr-2 h-4 w-4" />
        Google
      </Button>
      <Button variant="outline" onClick={() => console.log('Apple OAuth')}>
        <AppleLogo className="mr-2 h-4 w-4" />
        Apple
      </Button>
      <Button variant="outline" onClick={() => console.log('Facebook OAuth')}>
        <FacebookLogo className="mr-2 h-4 w-4" />
        Facebook
      </Button>
    </div>
  );
}
