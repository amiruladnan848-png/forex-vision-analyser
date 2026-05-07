import { motion } from "framer-motion";
import Header from "@/components/Header";
import MarketSessions from "@/components/MarketSessions";
import ChartAnalyzer from "@/components/ChartAnalyzer";
import BinarySignalPanel from "@/components/BinarySignalPanel";
import OwnerBadge from "@/components/OwnerBadge";
import OwnerBackdrop from "@/components/OwnerBackdrop";
import MoneyManagementRules from "@/components/MoneyManagementRules";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";

const Index = () => {
  const { user, loading, isApproved, isAdmin, apiKey } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg scanline flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const hasAccess = isApproved || isAdmin;

  return (
    <div className="min-h-screen bg-background grid-bg scanline relative">
      <OwnerBackdrop />
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-5xl relative">
        <OwnerBadge />

        {!hasAccess ? (
          <motion.div
            className="terminal-card p-12 text-center glow-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShieldAlert className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold tracking-wider mb-2">ACCOUNT PENDING</h2>
            <p className="font-mono text-sm text-muted-foreground">
              Your account is pending admin approval. Please contact{" "}
              <a
                href="https://t.me/amirul_adnan_trader"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                @amirul_adnan_trader
              </a>{" "}
              for access.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <MarketSessions />
            </motion.div>

            {!apiKey ? (
              <motion.div
                className="terminal-card p-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="font-display text-sm tracking-wider text-muted-foreground">
                  ⚡ WAITING FOR ADMIN TO CONFIGURE API KEY
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ChartAnalyzer apiKey={apiKey} />
              </motion.div>
            )}

            <MoneyManagementRules />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
