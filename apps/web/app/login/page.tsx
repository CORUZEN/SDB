import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}