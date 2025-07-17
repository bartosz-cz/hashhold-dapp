import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  useTheme,
  Button,
  TextField,
  LinearProgress,
} from "@mui/material";
import { IconButton, ClickAwayListener } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
export default function Roadmap() {
  /* data */
  const dappRoadmap = [
    {
      icon: <CheckCircleIcon />,
      title: "Hbar support",
      desc: "Form that lets users deposit (hold) and withdraw HBAR in the smart contract.",
      done: true,
      progress: 100,
    },
    {
      icon: <CheckCircleIcon />,
      title: "HTS token example",
      desc: "Demo form for holding and withdrawing an example HTS token (SAUCE).",
      done: true,
      progress: 100,
    },
    {
      icon: <CheckCircleIcon />,
      title: "Service info",
      desc: "Dashboard showing the current amount of staked tokens and HBAR rewards—claimed and unclaimed.",
      done: true,
      progress: 100,
    },
    {
      icon: <CheckCircleIcon />,
      title: "Welcome Page",
      desc: "Landing page with a concise overview of HashHold and its benefits.",
      done: true,
      progress: 100,
    },
    {
      icon: <CheckCircleIcon />,
      title: "Roadmap Page",
      desc: "Page that showcases completed milestones and upcoming goals.",
      done: true,
      progress: 100,
    },
    {
      icon: <RadioButtonUncheckedIcon />,
      title: "About Page",
      desc: "In-depth explanation of how the service works.",
      done: false,
      progress: 95,
    },
    {
      icon: <RadioButtonUncheckedIcon />,
      title: "Wide HTS support",
      desc: "Enable staking for a wide range of HTS tokens—any token swappable to HBAR on SaucerSwap will be supported.",
      done: false,
      progress: 10,
    },
  ];

  const contractRoadmap = [
    {
      icon: <CheckCircleIcon />,
      title: "HBAR support",
      desc: "Smart-contract logic for holding, withdrawing, and distributing penalty rewards in HBAR for HBAR deposits.",
      done: true,
      progress: 100,
    },
    {
      icon: <CheckCircleIcon />,
      title: "HTS token support",
      desc: "Smart-contract logic for holding, withdrawing, and distributing penalty rewards in HBAR for HTS-token deposits.",
      done: true,
      progress: 100,
    },
    {
      icon: <RadioButtonUncheckedIcon />,
      title: "HashHold tokens",
      desc: "Issue HashHold tokens after a completed hold; later burn them to boost future HBAR rewards.",
      done: false,
      progress: 20,
    },
    {
      icon: <RadioButtonUncheckedIcon />,
      title: "xHashHold tokens",
      desc: "xHashHold tokens are minted at the start of a hold and required for withdrawal—but can be freely traded meanwhile.",
      progress: 0,
    },
    {
      icon: <RadioButtonUncheckedIcon />,
      title: "Best-APY router v1",
      desc: "Route each token to the external staking service with the best APY.",
      progress: 0,
    },
  ];

  /* responsive centring */
  const [w, setW] = useState<number>(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const MIN_OFFSET = 98; // phones / small tablets
  const MAX_OFFSET = 260; // very wide desktops
  const ratio = 0.2;

  const branchOffset = Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, w * ratio));
  const isSmall = useMediaQuery("(max-width:700px)");
  const branchTop = 30;
  const curveDepth = 50;

  const itemGap = isSmall ? 120 : 170;

  const cardH = isSmall ? 80 : 150;

  const maxItems = Math.max(dappRoadmap.length, contractRoadmap.length);
  const svgHeightOffset = isSmall ? 200 : 260;
  const svgHeight =
    branchTop + curveDepth + (maxItems - 1) * itemGap + svgHeightOffset;
  const svgWidth = Math.max(w, branchOffset * 2 + 100);
  const cx = svgWidth / 2;

  const cardW = isSmall ? 185 : 260;
  const theme = useTheme();
  const doneColorR = "#8F5BFF";
  const doneColorL = " #6842d3";
  const doneColor = "#8F5BFF";
  const todoColor = theme.palette.grey[600];
  const lineColor = doneColor;
  const milestoneY = (i: number) =>
    branchTop + curveDepth + 100 + i * itemGap + cardH / 2; // środek karty
  const lastIdxLeft = dappRoadmap.length - 1; // ostatni element lewego arraya
  const lastIdxRight = contractRoadmap.length - 1; // ostatni element prawego

  /* funkcja zwracająca Y górnej krawędzi karty */
  const cardTopY = (i: number) =>
    branchTop + // start pnia
    curveDepth + // pierwsze „kolano”
    100 + // Twój stały padding
    i * itemGap; // odstęp między kartami

  const yEndLeft = cardTopY(lastIdxLeft);
  const yEndRight = cardTopY(lastIdxRight);
  const lastDoneLeft = dappRoadmap.map((m) => m.done).lastIndexOf(true);
  const lastDoneRight = contractRoadmap.map((m) => m.done).lastIndexOf(true);
  const titleY = branchTop + curveDepth - 40; // kilka px nad pierwszą kartą
  const yStopLeft = lastDoneLeft >= 0 ? milestoneY(lastDoneLeft) : branchTop;
  const yStopRight = lastDoneRight >= 0 ? milestoneY(lastDoneRight) : branchTop;
  const branchPath = (side: "left" | "right", yEnd: number) => {
    const sign = side === "left" ? -1 : 1;
    const bendX = cx + sign * branchOffset;
    return `
    M ${cx} ${branchTop}
    C ${cx}                       ${branchTop + curveDepth * 0.6},
      ${bendX}                    ${branchTop + curveDepth * 0.4},
      ${bendX}                    ${branchTop + curveDepth}
    C ${bendX}                    ${branchTop + curveDepth * 1.3},
      ${bendX}                    ${branchTop + curveDepth * 1.3},
      ${bendX}                    ${branchTop + curveDepth * 1.6}
    V ${yEnd}
  `;
  };
  const headerY = branchTop + curveDepth + cardH / 2;
  const BranchHeader = ({
    x,
    y,
    label,
    side,
  }: {
    x: number;
    y: number;
    label: string;
    side: "left" | "right";
  }) => (
    <foreignObject
      x={x - 100 / 2}
      y={y - 50 / 2 - 20}
      width={100}
      height={50}
      style={{ overflow: "visible" }}
    >
      <Card
        sx={{
          width: "100%",
          height: "100%",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          border: `2px solid ${
            side === "left" ? doneColorL : doneColorR //  ← border
          }`,
          boxShadow: `${side === "left" ? "-" : ""}2px 0 8px ${
            side === "left"
              ? doneColorL //  ← cień L
              : doneColorR //  ← cień R
          }`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      </Card>
    </foreignObject>
  );
  /* 4. -------------- CARD COMPONENT ----------------------------- */
  const Milestone = ({
    x,
    y,
    title,
    desc,
    done,
    compact,
    progressValue,
    side,
  }: {
    x: number;
    y: number;
    icon: React.ReactNode;
    title: string;
    desc: string;
    done: boolean;
    compact: boolean;
    progressValue: number;
    side: "left" | "right";
  }) => (
    <foreignObject
      x={x - cardW / 2}
      y={y - cardH / 2}
      width={cardW}
      height={cardH}
      style={{ overflow: "visible", pointerEvents: "auto" }}
    >
      <Card
        sx={{
          width: "100%",
          height: "100%",
          p: 1.5,
          display: compact ? "block" : "flex",
          gap: 1.5,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `2px solid ${
            done
              ? side === "left"
                ? doneColorL
                : doneColorR //  ← border
              : todoColor
          }`,
          boxShadow: done
            ? `${side === "left" ? "-" : ""}2px 0 8px ${
                side === "left"
                  ? doneColorL //  ← cień L
                  : doneColorR //  ← cień R
              }`
            : `${side === "left" ? "-" : ""}2px 0 8px rgba(0,0,0,.35)`,
          position: "relative",
        }}
      >
        {/* ❔ w prawym-górnym rogu (obydwa tryby) */}
        {compact && (
          <InfoTip
            text={desc}
            iconSx={{
              position: "absolute",
              top: 6,
              right: 6,
              color: todoColor,
            }}
          />
        )}

        {compact ? (
          <>
            {/* Tytuł wyśrodkowany */}
            <Typography
              variant="body2"
              sx={{
                color: done ? "white" : todoColor,
                fontWeight: 600,
                textAlign: "center",

                mt: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>

            {/* Pasek postępu u dołu */}
            <Box
              sx={{
                width: "100%",
                height: 6,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 4,
                overflow: "hidden",
                mt: 1,
                mb: 0,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: "100%", // pełna szerokość(90deg, #6139AB, #8424C6, #9028C7))
                  backgroundImage: done
                    ? "linear-gradient(90deg, #6139AB, #8424C6, #9028C7)"
                    : "linear-gradient(90deg, rgb(61, 61, 61), rgb(121, 121, 121), rgb(186, 186, 186))",
                  backgroundSize: "100% 100%", // gradient rozciągnięty na 100% długości
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "left", // zawsze od lewej
                  maskImage: `linear-gradient(to right, black ${progressValue}%, transparent ${progressValue}%)`,
                  WebkitMaskImage: `linear-gradient(to right, black ${progressValue}%, transparent ${progressValue}%)`,
                  transition:
                    "mask-image 0.3s ease, -webkit-mask-image 0.3s ease",
                }}
              />
            </Box>
          </>
        ) : (
          <>
            {/* Kolumna tekstu + pasek pod spodem */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center", // poziome centrowanie-X
                /* zostaw domyślne justifyContent:'flex-start'
       – treść będzie na górze, a progress spadnie na dół */
              }}
            >
              {/* tytuł */}
              <Typography
                variant="body2"
                sx={{
                  color: done ? "white" : todoColor,
                  fontWeight: 600,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </Typography>

              {/* opis */}
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  color: todoColor,
                  opacity: 0.8,

                  /* --- make it wrap & justify --- */
                  whiteSpace: "normal", // allow line-breaks
                  overflow: "visible", // no clipping
                  textOverflow: "unset", // no ellipsis

                  textAlignLast: "start", // optional: centre the last line
                }}
              >
                {desc}
              </Typography>

              {/* pasek postępu przyklejony do dołu karty */}
              <Box
                sx={{
                  width: "100%",
                  height: 6,
                  mt: "auto", // ← klucz: przenosi box na dół
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: "100%",
                    backgroundImage: done
                      ? "linear-gradient(90deg,#6139AB,#8424C6,#9028C7)"
                      : "linear-gradient(90deg,rgb(61,61,61),rgb(121,121,121),rgb(186,186,186))",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left",
                    maskImage: `linear-gradient(to right, black ${progressValue}%, transparent ${progressValue}%)`,
                    WebkitMaskImage: `linear-gradient(to right, black ${progressValue}%, transparent ${progressValue}%)`,
                    transition:
                      "mask-image .3s ease, -webkit-mask-image .3s ease",
                  }}
                />
              </Box>
            </Box>
          </>
        )}
      </Card>
    </foreignObject>
  );
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          marginTop: -4,
          overflowX: "hidden",

          ...(isSmall
            ? {
                /* mobile: body scroll */ height: "auto",
                overflowY: "hidden",
              }
            : {
                /* desktop: fixed window */
                height: "calc(100vh - 50px)", // 64 px = AppBar
                overflowY: "auto",
              }),

          paddingTop: 2,

          backgroundColor: "#222222",
          zIndex: 0,
        }}
      >
        <svg
          width={"100%"}
          height={svgHeight}
          viewBox={`0 0 ${window.innerWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMin meet"
          style={{
            display: "block",
            margin: "0",
            pointerEvents: "none",
            justifyItems: "center",
            alignItems: "center",
            backgroundColor: "#222222",
          }}
        >
          <defs>
            <linearGradient
              id="fadePurple"
              gradientUnits="userSpaceOnUse" // ← key line
              x1={cx}
              y1={0}
              x2={cx}
              y2={branchTop} // runs the full trunk length
            >
              <stop offset="0%" stopColor="#8F5BFF" stopOpacity="0" />
              <stop offset="90%" stopColor="#8F5BFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#8F5BFF" stopOpacity="1" />
            </linearGradient>
            {/* poziomy fiolet  →  jaśniejszy fiolet */}
            <linearGradient
              id="gradVertL"
              gradientUnits="userSpaceOnUse"
              x1={cx - branchOffset}
              y1={headerY}
              x2={cx - branchOffset}
              y2={yStopLeft}
            >
              <stop offset="0%" stopColor="#6842d3" />
              <stop offset="100%" stopColor="rgb(51, 32, 104)" />
            </linearGradient>
            <linearGradient
              id="gradVertR"
              gradientUnits="userSpaceOnUse"
              x1={cx - branchOffset}
              y1={headerY}
              x2={cx - branchOffset}
              y2={yStopLeft}
            >
              <stop offset="0%" stopColor=" #8F5BFF" />
              <stop offset="100%" stopColor="rgb(93, 59, 165)" />
            </linearGradient>
            {/* pionowy fiolet (ta sama gama) */}
            <linearGradient
              id="gradVertical"
              gradientUnits="userSpaceOnUse"
              x1={cx - branchOffset}
              y1={headerY}
              x2={cx - branchOffset}
              y2={yStopLeft}
            >
              <stop offset="0%" stopColor="#5D3ABF" />
              <stop offset="100%" stopColor="#8F5BFF" />
            </linearGradient>
          </defs>
          {/* trunk */}
          <line
            x1={cx}
            y1={0}
            x2={cx}
            y2={branchTop}
            stroke="url(#fadePurple)"
            strokeWidth={4}
          />
          {/* left branch */}
          {/* left branch */}
          {/* left branch – smooth left, then smooth down */}
          {/* lewa gałąź – całość w jednym <path> */}
          <path
            d={branchPath("left", yEndLeft)}
            fill="none"
            stroke={todoColor}
            strokeWidth={4}
          />
          <path
            d={branchPath("right", yEndRight)}
            fill="none"
            stroke={todoColor}
            strokeWidth={4}
          />
          {/* --- FIOLET do ostatniego done --- */}
          {lastDoneLeft >= 0 && (
            <path
              d={branchPath("left", yStopLeft)}
              fill="none"
              stroke="url(#gradVertL)"
              strokeWidth={4}
            />
          )}
          {lastDoneRight >= 0 && (
            <path
              d={branchPath("right", yStopRight)}
              fill="none"
              stroke="url(#gradVertR)"
              strokeWidth={4}
            />
          )}
          <BranchHeader
            x={cx - branchOffset}
            y={headerY}
            label="DApp"
            side="left"
          />
          <BranchHeader
            x={cx + branchOffset}
            y={headerY}
            label="On-Chain"
            side="right"
          />
          "{/* milestones – dApp */}
          {dappRoadmap.map((m, i) => (
            <Milestone
              key={`d${i}`}
              x={cx - branchOffset}
              y={milestoneY(i)}
              icon={m.icon}
              title={m.title}
              desc={m.desc}
              done={m.done}
              compact={isSmall}
              progressValue={m.progress}
              side="left"
            />
          ))}
          {/* milestones – Contract */}
          {contractRoadmap.map((m, i) => (
            <Milestone
              key={`c${i}`}
              x={cx + branchOffset}
              y={milestoneY(i)}
              icon={m.icon}
              title={m.title}
              desc={m.desc}
              done={m.done}
              compact={isSmall}
              progressValue={m.progress}
              side="right"
            />
          ))}
        </svg>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            // 👉 tu możesz dodać wysyłkę np. do Firestore / e-maila / API
          }}
          sx={{
            width: "100%",

            mx: "auto",
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, sm: 4 },
            backgroundColor: "#2A2A2A",
            backdropFilter: "blur(6px)",
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.53)", // 💜 fioletowy cień
            transition: "box-shadow 0.3s ease-in-out",

            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "center", sm: "center", md: "center" },
            justifyContent: "center",
            alignContent: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              flexShrink: 0,
              color: "#fff",
              display: "flex",
              minWidth: 140,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            Got an idea or a question?
          </Typography>

          <TextField
            name="message"
            placeholder="Write your proposal or question…"
            variant="outlined"
            fullWidth
            multiline
            minRows={isSmall ? 3 : 1}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#555",
              },
              maxWidth: "500px",
              display: "flex",
            }}
          />

          <Button
            type="submit"
            variant="contained"
            sx={{
              whiteSpace: "nowrap",
              px: { xs: 4, sm: 5 },
              py: 1.5,
              fontWeight: "bold",
              background: "linear-gradient(90deg,#a47aff 0%,#8F5BFF 100%)",
              boxShadow: "0 0 12px #8F5BFF55",
              alignSelf: { xs: "stretch", sm: "center" },

              mx: { xs: "auto", sm: 0 },

              height: 38,
              display: "flex",
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function InfoTip({
  text,
  iconSx = {},
}: {
  text: string;
  iconSx?: SxProps<Theme>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      {/* --------- TOOLTIP --------- */}
      <Tooltip
        title={text}
        arrow
        placement="top"
        open={open}
        // wyłączamy klasyczne trigery
        disableHoverListener
        disableTouchListener
        disableFocusListener
        // 🔽 własny wygląd dymka + strzałki
        componentsProps={{
          tooltip: {
            sx: {
              px: 1.5,
              py: 1,
              maxWidth: 300,
              bgcolor: "#2A2A2A",
              color: "#d5c2ff",
              fontSize: 13,
              fontWeight: 400,
              border: "1px solid  #8F5BFF",
              boxShadow: "0 0 6px rgba(29, 25, 38, 0.35)",
              backdropFilter: "blur(6px)",
            },
          },
          arrow: {
            sx: {
              color: "#5B46B1", // obramowanie strzałki
              "&:before": {
                bgcolor: "#2A2A2A", // faktyczne wypełnienie
                border: "1px solid #5B46B1",
              },
            },
          },
        }}
      >
        {/* ---------- IKONA (trigger) ---------- */}
        <IconButton
          onClick={() => setOpen((o) => !o)}
          size="small"
          disableRipple
          sx={{
            p: 0.5,
            borderRadius: "50%",
            color: "#bdbdbd",
            transition: "background .2s, transform .15s",

            "&:hover": {
              background: "rgba(143,91,255,.15)",
              color: "#d5c2ff",
            },
            "&:active": {
              background: "rgba(143,91,255,.35)",
              transform: "scale(.92)",
            },
            "&.Mui-focusVisible, &:focus, &:focus-visible": {
              outline: "none",
            },
            ...iconSx,
          }}
        >
          <HelpOutlineIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </ClickAwayListener>
  );
}
