import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { fa } from "../locales/fa";

interface LoginPageProps {
  onLogin: () => void;
  loading: boolean;
  error: string | null;
}

export function LoginPage({ onLogin, loading, error }: LoginPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">

      <div className="text-center mb-8">
        <span className="text-6xl mb-4 block">🍽️</span>
        <h1 className="text-2xl font-bold mb-2">{fa.loginTitle}</h1>
      </div>

      <Button
        onClick={() => {
          console.log("CLICK");

          console.log(window.Telegram);

          console.log(window.Telegram?.WebApp);

          console.log(window.Telegram?.WebApp?.initData);

          console.log(window.Telegram?.WebApp?.initDataUnsafe);

          onLogin();
        }}
      >
        ورود به صف
      </Button>

      {loading && <Spinner size="lg" />}

      {error && (
        <div className="mt-5">
          {error}
        </div>
      )}

    </div>
  );
}
