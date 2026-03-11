import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">DMDS</h1>
          <p className="text-gray-500 mt-1">Dynamic Module Data System</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
