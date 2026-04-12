import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import PinLock from "@/components/PinLock";
import Header from "@/components/Header";
import ApiKeySetup from "@/components/ApiKeySetup";
import MarketSessions from "@/components/MarketSessions";
import ChartAnalyzer from "@/components/ChartAnalyzer";

const Index = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("fx_twelvedata_key") || "");

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("fx_twelvedata_key", key);
  };

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <AnimatePresence mode="wait">
        {!unlocked && <PinLock key="lock" onUnlock={() => setUnlocked(true)} />}
      </AnimatePresence>

      {unlocked && (
        <>
          <Header />
          <main className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ApiKeySetup onSave={handleSaveKey} savedKey={apiKey} />
              <MarketSessions />
            </div>

            {!apiKey ? (
              <div className="terminal-card p-12 text-center">
                <div className="font-display text-sm tracking-wider text-muted-foreground">
                  ⚡ SETUP API KEY TO ENABLE CHART ANALYSIS
                </div>
              </div>
            ) : (
              <ChartAnalyzer apiKey={apiKey} />
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default Index;
