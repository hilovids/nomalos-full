import Card from "../../../components/card";

export const metadata = {
  title: "Privacy Policy | Nomalos",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
        <Card className="w-full mt-8 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-[#60a5fa]">Privacy Policy</h1>
          <p className="text-gray-200 mb-4">
            Your privacy is important to us. On this site, we <span className="font-semibold text-white">do not</span> store any personal data from users apart from the username and a hash of the password you provide. All other information is generated as a result of your interaction with the site (wins, losses, etc.) and is not personally identifying.
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>
              <span className="font-semibold text-white">Username:</span> Used to identify you on the platform. You choose your own username.
            </li>
            <li>
              <span className="font-semibold text-white">Password:</span> Used solely for authentication. Your password is securely stored and never shared.
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
}