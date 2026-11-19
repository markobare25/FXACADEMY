import React from 'react';
import { usePlatform } from '../context/PlatformContext';

export const LegalPage: React.FC = () => {
  const { settings } = usePlatform();

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Legal, Risk Disclosure & Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {settings.brand_name} Transparency & Governance Standards
        </p>
      </div>

      <section className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 p-6 space-y-3">
        <h2 className="text-lg font-bold text-[#881337] dark:text-rose-400">
          1. High-Risk Investment & Educational Disclaimer
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Trading foreign exchange (Forex), commodities (including Gold and Silver), equity indices, and cryptocurrencies on margin carries a high level of financial risk and may not be suitable for all investors. High leverage can work against you as well as for you. Before deciding to trade leveraged markets, carefully consider your investment objectives, level of experience, and risk appetite. The possibility exists that you could sustain a loss of some or all of your deposited capital.
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          All trading signals, market updates, chart commentary, and Academy modules published on {settings.brand_name} are provided strictly for educational and informational purposes unless explicitly designated as regulated advisory under applicable jurisdiction. Nothing on this platform constitutes personalized financial advice or a guarantee of profit.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          2. Terms and Conditions
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          By registering or accessing {settings.brand_name}, you agree to use published signals, educational materials, and community spaces lawfully and in accordance with these Terms. Redistribution of proprietary educational material or commercial scraping of live feeds without authorization is prohibited.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Community participants must not post fraudulent investment schemes, guaranteed-return promises, abusive language, or unsolicited affiliate links. Administrators reserve the right to moderate content and suspend violating accounts.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          3. Privacy Policy & Notification Data
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          We store only the data required to operate your account: your display name, email address, hashed password credentials, notification category preferences, Academy progress, watchlists, and browser push subscription endpoints when you explicitly opt in.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          You may revoke push notifications at any time via your Profile settings or browser permissions, and you may permanently delete your account and associated records from the Profile page.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          4. Support & Compliance Contact
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Email: {settings.contact_email} {settings.contact_phone ? `· Phone: ${settings.contact_phone}` : ''}
        </p>
        {settings.contact_address && (
          <p className="text-sm text-slate-600 dark:text-slate-300">{settings.contact_address}</p>
        )}
      </section>
    </div>
  );
};
