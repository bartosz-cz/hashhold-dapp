// About.tsx
import { useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Card,
  Typography,
  useTheme,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import Markdown from "markdown-to-jsx"; // <–– if you don’t have it,  npm i markdown-to-jsx

/* ---------- 1. Your topics & copy -------------------------------------- */
const topics: { id: string; label: string; body: string }[] = [
  {
    id: "mission",
    label: "Our Mission",
    body: `
**HashHold** aims to become a single, unified place to stake *all* your tokens.

* No more hunting for the highest-APY pool for every asset.  
* No more juggling half-a-dozen staking dashboards.  
* And no more guessing whether a token can even be staked—if it can be swapped to **HBAR** on SaucerSwap, we’ll support it.  
`,
  },
  {
    id: "mechanics",
    label: "How It Works",
    body: `
1. **Routing to best APY**  
   Each deposit is automatically staked in the external service offering the highest yield.  
   If no external pool exists, the tokens remain in HashHold’s contract earning the base rate.

2. **Lock-in period**  
   You choose the holding period.  
   Withdrawing early incurs a **10 % penalty** on the amount withdrawn.

3. **Penalty → Rewards**  
   Early-exit penalties are swapped to HBAR and distributed, pro-rata, to diligent holders as weekly rewards.

4. **Extra incentive**  
   After a successful hold, you receive **HashHold tokens**—these can later be burned to boost your share of future HBAR rewards.
`,
  },
  {
    id: "hold",
    label: "Holding Tokens",
    body: `
Navigate to the **Hold** tab:

1. **Select a token**  
   • Minimum total value: \$1  

2. **Enter the amount** and **choose the lock period**  
   Your *reward shares* are calculated from token value × period.  
   You can also boost shares by burning HashHold tokens.

3. **Confirm the transaction**  
   The contract sends an equal amount of **xHashHold** to your wallet  
   \`xHashHold = token value × period\`
`,
  },
  {
    id: "withdraw",
    label: "Withdrawing",
    body: `
1. Connect the **same wallet** you used to deposit.
2. Keep **at least** the number of **xHashHold** tokens you received when staking—these are burned when you withdraw.
3. If you withdraw **before** the lock period ends, a **10 %** penalty is deducted and added to the HBAR reward pool.
4. Otherwise, the original tokens are returned and you receive **HashHold** reward tokens.

`,
  },
  {
    id: "hbar_rewards",
    label: "HBAR Rewards",
    body: `
* Rewards accumulate in **weekly epochs** and are claimable any time.  
• Your payout is proportional to **your reward-share balance ÷ total shares in the epoch**.

* Shares are added when you deposit and removed when you withdraw.  
* Penalties from early withdrawals—no matter which token—are swapped to HBAR and fund the pool.  
* Rewards are auto-claimed whenever you interact with the contract, or you can claim manually.
`,
  },
  {
    id: "hashhold",
    label: "HashHold Token",
    body: `
HashHold tokens are minted when you complete a hold without penalties.

* **Utility:** burn them during a new deposit to boost your HBAR-reward shares.  
* **Supply pressure:** every boost burns tokens, so value is tied to user demand and the rate of early exits.
`,
  },
  {
    id: "xhashhold",
    label: "xHashHold Token",
    body: `
*Minted on deposit, burned on withdrawal.*

* Acts as a *receipt* proving you still own the underlying tokens.  
* Amount minted = token value × lock period.  
* xHashHold is freely transferable, but you must hold **at least the original amount** to withdraw your stake.
`,
  },
  {
    id: "contact",
    label: "Contact",
    body: `

`,
  },
];

/* ---------- 2. Component ------------------------------------------------ */
export default function About() {
  const theme = useTheme();

  const isSmall = useMediaQuery("(max-width:700px)");
  const [current, setCurrent] = useState(topics[0]);

  /* ----- reusable menu item renderer ----------------------------------- */
  const renderItem = (t: (typeof topics)[number], compact = false) => {
    const selected = current.id === t.id;

    return (
      <Box
        key={t.id}
        sx={{
          /* ——— 50 % szerokości rodzica ——— */
          flex: "1 0 50%", // basis 50 %, nie zwęża się
          maxWidth: "50%", // gwarancja, że nie przekroczy

          bgcolor: selected ? "#2F2740" : "#1e1e1e",
          color: selected ? "#835BFF" : "#fff",
          cursor: "pointer",
        }}
        onClick={() => setCurrent(t)}
      >
        <Box px={2} py={1}>
          <Typography
            variant="subtitle2"
            sx={{ color: selected ? "#8F5BFF" : "#ddd", textAlign: "center" }}
          >
            {t.label}
          </Typography>
        </Box>
      </Box>
    );
  };

  /* ----- DESKTOP rail (unchanged) -------------------------------------- */
  const DesktopMenu = (
    <Box
      sx={{
        width: 220,
        flexShrink: 0,
        bgcolor: "#1e1e1e",
        marginTop: -2,
        paddingTop: 2,

        height: "100%",

        borderRight: "1px solid #333",
      }}
    >
      <List disablePadding>
        {topics.map((t) => {
          const selected = current.id === t.id;
          return (
            <ListItemButton
              key={t.id}
              selected={selected}
              onClick={() => {
                setCurrent(t);
                setDrawerOpen(false);
              }}
              sx={{
                "&.Mui-selected": {
                  bgcolor: "rgba(143,91,255,0.15)",
                  "& .MuiListItemText-primary": { color: "#8F5BFF" },
                },
              }}
            >
              <ListItemText primary={t.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  /* ----- MOBILE horizontal strip --------------------------------------- */
  /* ---------- mobile, sticky, scroll-as-needed ------------------------ */
  /* ---------- mobile, sticky, scroll-if-needed ----------------------- */
  const MobileMenu = (
    <Box /* sticky container – 100 % wide, zero padding */
      sx={{
        top: 0,
        zIndex: 1,
        bgcolor: "#222",
        width: "100%",
        overflow: "hidden",
        paddingTop: 2, // no horizontal scroll bar
        backgroundColor: "#1e1e1e",
      }}
    >
      <Box /* flex row that wraps – also zero padding/gap */
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0, // remove inter-chip gap
          width: "100%",
        }}
      >
        {topics.map((t) => renderItem(t, true /* compact */))}
      </Box>
    </Box>
  );
  /* ──────────────────────────── RENDER ──────────────────────────────── */
  return (
    <Box // ───── root layout
      sx={{
        display: "flex",
        flexDirection: isSmall ? "column" : "row",
        alignItems: "flex-start", // keep children at the left edge
        justifyContent: "flex-start",
        minHeight: "calc(100vh - 60px)",
        flexGrow: 1,
        maxWidth: window.innerWidth,
        height: isSmall ? "auto" : "calc(100vh - 64px)",
        width: "100vw",
        bgcolor: "#222",
        alignSelf: "start",
        mt: isSmall ? -2 : -2,
        pt: isSmall ? 0 : 2,
      }}
    >
      {isSmall ? MobileMenu : DesktopMenu}

      {/* ───── content area ─────────────────────────────── */}
      <Box
        component="main"
        sx={{
          /* on desktop we let it grow, on mobile we use natural height */
          flex: isSmall ? "0 0 auto" : 1,

          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",

          p: isSmall ? 3 : 5,
          overflowY: isSmall ? "visible" : "auto",
          color: "#ddd",
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, color: "#fff" }}>
          {current.label}
        </Typography>

        <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.15)" }} />

        <Markdown
          options={{
            overrides: {
              h2: { component: Typography, props: { variant: "h6", mb: 1.5 } },
              p: { component: Typography, props: { mb: 2, lineHeight: 1.7 } },
              li: {
                component: (props) => (
                  <Typography
                    component="li"
                    sx={{ ml: 2, listStyle: "disc", mb: 0.5 }}
                    {...props}
                  />
                ),
              },
            },
          }}
        >
          {current.body}
        </Markdown>
      </Box>
    </Box>
  );
}
