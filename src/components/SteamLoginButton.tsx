import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SteamLoginButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SteamLoginButton: React.FC<SteamLoginButtonProps> = ({ className = '', size = 'md' }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      // Construct Steam OpenID URL using window.location.origin
      const baseUrl = window.location.origin;
      const returnTo = `${baseUrl}/api/auth/steam/return`;
      const realm = `${baseUrl}/`;

      const params = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': returnTo,
        'openid.realm': realm,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      });

      const steamAuthUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;

      // Open Steam login directly in a top-level popup to bypass iframe X-Frame-Options blocking
      const width = 800;
      const height = 700;
      const left = Math.max(0, (window.screen.width - width) / 2);
      const top = Math.max(0, (window.screen.height - height) / 2);

      const popup = window.open(
        steamAuthUrl,
        'steam_openid_login',
        `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        alert('لطفاً در مرورگر خود باز شدن پنجره پاپ‌آپ (Pop-up) را برای این سایت مجاز کنید تا پنجره استیم باز شود.');
      }
    } catch (err) {
      console.error('[SteamLogin] Failed to initiate login:', err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5',
    md: 'px-4 py-2 text-sm font-semibold gap-2',
    lg: 'px-6 py-3 text-base font-bold gap-2.5',
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className={`inline-flex items-center justify-center bg-white text-[#0B0C10] hover:bg-[#F0F0F0] active:scale-[0.98] transition-all duration-150 rounded-lg shadow-md hover:shadow-lg font-medium cursor-pointer disabled:opacity-75 ${sizeClasses[size]} ${className}`}
      title="ورود امن از طریق پنجره رسمی استیم"
    >
      {/* Steam Icon */}
      {loading ? (
        <Loader2 className={size === 'sm' ? 'w-4 h-4 animate-spin' : size === 'lg' ? 'w-6 h-6 animate-spin' : 'w-5 h-5 animate-spin'} />
      ) : (
        <svg
          className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11.979 0C5.626 0 .445 4.945.03 11.207l6.634 2.738a3.743 3.743 0 0 1 2.112-.653c.277 0 .546.03.806.088l3.072-4.455c-.04-.202-.066-.411-.066-.625 0-1.87 1.516-3.386 3.386-3.386 1.87 0 3.386 1.516 3.386 3.386 0 1.87-1.516 3.386-3.386 3.386-.168 0-.332-.016-.492-.041l-4.38 3.12c.046.242.072.49.072.744 0 2.07-1.678 3.748-3.748 3.748-1.782 0-3.266-1.246-3.642-2.899L.373 14.88C1.597 20.088 6.34 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zM7.55 17.514c-1.127 0-2.041-.914-2.041-2.041 0-.414.126-.798.34-1.12l2.302.951c-.04.148-.063.304-.063.465 0 .963.781 1.745 1.745 1.745.161 0 .317-.023.465-.063l.951 2.302a2.035 2.035 0 0 1-1.12.341c-1.127 0-2.041-.914-2.041-2.041zm8.433-8.814c-.935 0-1.693-.758-1.693-1.693 0-.935.758-1.693 1.693-1.693.935 0 1.693.758 1.693 1.693 0 .935-.758 1.693-1.693 1.693z" />
        </svg>
      )}
      <span>{loading ? 'در حال اتصال...' : 'ورود با استیم'}</span>
    </button>
  );
};

