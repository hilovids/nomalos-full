import React from "react";

export const metadata = {
  title: "Privacy Policy | Nomalos",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#232323]" style={{ paddingTop: "88px", paddingBottom: "64px" }}>
      <div className="max-w-2xl w-full bg-[#181818] rounded-lg shadow p-8 mt-8">
        <h1 className="text-3xl font-bold mb-4 text-[#60a5fa]">Privacy Policy</h1>
        <p className="text-gray-200 mb-4">
          Your privacy is important to us. On this site, we store <span className="font-semibold text-white">no personal data</span> from users apart from the username and password you choose to provide.
        </p>
        <ul className="list-disc list-inside text-gray-300 mb-4">
          <li>
            <span className="font-semibold text-white">Username:</span> Used to identify you on the platform. You choose your own username.
          </li>
          <li>
            <span className="font-semibold text-white">Password:</span> Used solely for authentication. Your password is securely stored and never shared.
          </li>
        </ul>
        <p className="text-gray-200">
          We do not collect, store, or share any other personal information. No email addresses or other identifying data are required or retained.
        </p>
      </div>
    </div>
  );
}