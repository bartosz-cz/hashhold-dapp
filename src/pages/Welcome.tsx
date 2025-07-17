import React, { useState, useEffect, useRef, useLayoutEffect } from "react";

import { Box, Card, Typography, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import Step1 from "../assets/step1.svg";
import Step2 from "../assets/step2.svg";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { NavLink } from "react-router-dom";
export default function Welcome() {
  const steps = [
    {
      icon: Step1,
      title: "Best Staking Access", // zamiast "Aviability"
      descList: [
        "Auto-stake for highest APY",
        "Stake tokens others can't",
        "Secure smart contract custody",
      ],
      how: "When you deposit, HashHold routes your tokens to the external staking service with the best available APY for that asset. Then is no services aviable for selcted token your still can earn reward from other users penlties and recive ahshhold tokens on staking end",
    },
    {
      icon: Step2,
      title: "Boosted Earnings",
      descList: [
        "Earn HBAR while You stake",
        "Get the best staking returns",
        "Collect HashHold utility tokens",
      ],
      how: "If any user withdraws before their chosen holding period ends, a 10% penalty fee is collected. All penalty fees are converted to HBAR and distributed proportionally among all active holders based on your stake duration, value, and HashHold tokens used for boosting.",
    },
  ];
  const [w, setW] = useState<number>(window.innerWidth);
  const firstBoxRef = useRef<HTMLDivElement>(null);
  const [firstBoxHeight, setFirstBoxHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = firstBoxRef.current;
    if (!el) return;

    // initial read
    setFirstBoxHeight(el.offsetHeight + 800);

    // keep it in sync when cards wrap / window resizes
    const ro = new ResizeObserver(([entry]) => {
      setFirstBoxHeight(entry.contentRect.height);
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const ringCount = 6;
  const rStart = 1800; // największy promień (może wystawać)
  const thickStart = 140; // grubość pierwszej wstęgi
  const thickEnd = 50; // grubość ostatniej wstęgi
  const gapR = 180; // ↙ RZECZYWISTY odstęp między pierścieniami (px)

  const rEnd = 120; // najmniejszy promień (musi się mieścić)

  const h = window.innerHeight;
  const centerY = rEnd; // 20 px margines od góry

  /* ---------- GENEROWANIE PIERŚCIENI ---------- */
  interface Ring {
    r: number;
    thick: number;
  }
  const rings: Ring[] = [];

  let currentR = rStart;
  for (let i = 0; i < ringCount; i++) {
    // malejąca grubość
    const thick = thickStart - ((thickStart - thickEnd) * i) / (ringCount - 1);

    rings.push({ r: currentR, thick });

    // następny promień = zewnętrzna krawędź – gapR – ½ kolejnej grubości
    currentR -= thick + gapR;
  }

  /* ---------- POMOCNICZE WARTOŚCI ---------- */
  const topOvershoot = rStart; // ile wystaje w górę
  const outerR = rings[0].r - rings[0].thick / 2; // środek stroke

  const cx = w / 2;
  console.warn(firstBoxHeight);
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "calc(100vh - 100px)",
        overflow: "none",
        alignItems: "center",
        alignContent: "center",
      }}
    >
      <Box
        ref={firstBoxRef}
        display="flex"
        alignItems="center"
        justifyContent="start"
        sx={{
          flexDirection: "column",
          top: "25px",
          overflow: "none",
          "@media (min-width:700px)": {
            top: "0px",
          },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={2}
          flexWrap="nowrap"
          py={2}
          sx={{
            width: "100%",
            flexDirection: "column",
            overflow: "none",

            minHeight: 0,
            paddingTop: "100px",

            "@media (min-width:700px)": {
              flexDirection: "row",
              paddingTop: "0px",

              maxHeight: "none",
            },
            "@media (max-height:700px)": {
              paddingTop: "0px",
              marginTop: "120px",
              maxHeight: "none",
            },
          }}
        >
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "rgba(18, 18, 18, 0.85)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(77, 77, 77, 0.25)",
                  width: "300px",
                  height: "480px",
                  "@media (min-width:700px)": {
                    width: "360px",
                    height: "430px",
                  },
                  minHeight: "410px", // if you want minimum size
                  p: 2,
                  alignItems: "center",
                  position: "relative",

                  flexShrink: 0, // <--- THIS IS IMPORTANT for scroll!
                }}
              >
                <Box
                  sx={{
                    height: "200px",
                    width: "200px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img src={step.icon} alt="" />
                </Box>
                <Box
                  sx={{
                    textAlign: "center",
                    width: "250px",
                    "@media (min-width:700px)": {
                      width: "310px",
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "#8F5BFF", mb: 2 }}
                  >
                    {step.title}
                  </Typography>
                  {step.descList.map((item, idx) => (
                    <Box
                      component="li"
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                        "@media (min-width:700px)": {
                          mb: 2,
                        },
                      }}
                    >
                      <CheckCircleIcon
                        sx={{ fontSize: 20, color: "#8F5BFF", mr: 1 }}
                      />
                      {item}
                    </Box>
                  ))}
                </Box>
                <Button
                  variant="text"
                  size="small"
                  component={NavLink}
                  sx={{
                    mt: "auto",
                    borderColor: "#8F5BFF",
                    color: "#8F5BFF",

                    "&:hover": {
                      background: "rgba(143,91,255,0.10)", // subtle purple on hover
                      color: "#8F5BFF",

                      boxShadow: "none",
                    },
                    // Optional: make it a little more pill in default state
                    background: "transparent",
                    transition: "background 0.2s, color 0.2s, font-weight 0.2s",
                  }}
                  to={"/about"}
                >
                  How it works?
                </Button>
              </Card>
              {i !== steps.length - 1 && (
                <Card
                  style={{
                    display: "flex",

                    alignItems: "center",
                  }}
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    alignSelf: "center",
                    flexDirection: "column",

                    backgroundColor: "rgba(18, 18, 18, 0.85)", // 10 % białej mgły
                    backdropFilter: "blur(8px)", // właściwy blur
                    WebkitBackdropFilter: "blur(8px)", // Safari / iOS
                    border: "1px solid rgba(77, 77, 77, 0.25)", // subtelny obrys (opcjonalnie)
                  }}
                >
                  <ArrowForwardIcon
                    sx={{
                      fontSize: 48,
                      color: "#8F5BFF",
                      transition: "transform 0.2s",
                      transform: {
                        xs: "rotate(90deg)", // pionowo (w dół) na mobile
                        "@media (min-width:700px)": { transform: "none" }, // poziomo powyżej 700px
                      },
                    }}
                  />
                </Card>
              )}
            </React.Fragment>
          ))}
        </Box>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          mt={2}
          mb={2} // odstęp od kart
        >
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 5,
              py: 1.5,
              background: "linear-gradient(90deg, #a47aff 30%, #8F5BFF 100%)",
              color: "#fff",
              fontWeight: "bold",
              ml: "auto",
              boxShadow: "0 2px 16px 0 #8F5BFF44",
              transition:
                "filter 0.3s cubic-bezier(0.4,0,0.2,1), color 0.2s, box-shadow 0.2s",
              filter: "brightness(1)",
              "&:hover": {
                filter: "brightness(0.65)",
                color: "#fff",
              },
              "&.Mui-disabled": {
                background: (theme) => theme.palette.action.disabledBackground,
                color: (theme) => theme.palette.action.disabled,
                boxShadow: "none",
              },

              borderRadius: 32,

              textTransform: "none",
            }}
            component={NavLink}
            to="/hold"
          >
            Try
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: "-45px",
          "@media (min-width:700px)": {
            top: "-60px",
            height: firstBoxHeight
              ? `${Math.max(firstBoxHeight, window.innerHeight - 30)}px`
              : "100vh",
          },
          left: 0,
          width: "100vw",

          height: firstBoxHeight
            ? `${Math.max(firstBoxHeight + 60, window.innerHeight)}px`
            : "100vh",
          overflow: "hidden",
          zIndex: -100,
          display: "flex",
          flexDirection: "column",
          justifyItems: "start",
          alignItems: "start",
          pointerEvents: "none",
          backgroundColor: "green",
          background: "red",
        }}
      >
        <Box
          sx={{
            top: 48,
            "@media (min-width:700px)": {
              top: 48,
            },
            "@media (min-height:700px)": {
              top: 32,
            },
            left: 0,
            width: "100vw",
            flexDirection: "column",
            justifyItems: "start",
            alignItems: "start",

            backgroundColor: "red",
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <svg
            width="100%"
            viewBox={`0 ${-topOvershoot} ${w} ${h + topOvershoot}`}
            style={{
              backgroundColor: "#222222",

              minHeight: "1000px",
              height: firstBoxHeight
                ? `${Math.max(firstBoxHeight + 60, window.innerHeight)}px`
                : "100vh",
            }}
          >
            <defs>
              {/* pełny okrąg jako path do textPath */}
              <path
                id="outerPath"
                d={`
          M ${cx + outerR},${centerY}
          A ${outerR},${outerR} 0 1 1 ${cx - outerR},${centerY}
          A ${outerR},${outerR} 0 1 1 ${cx + outerR},${centerY}
        `}
                fill="none"
              />
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#222" />
                <stop offset="20%" stopColor="#2A2A2A" />
                <stop offset="80%" stopColor="#2A2A2A" />
                <stop offset="100%" stopColor="#222" />
              </linearGradient>
              <filter
                id="ringShadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="8"
                  floodColor="#000"
                  floodOpacity="0.35"
                />
              </filter>
            </defs>

            {/* ----- PIERŚCIENIE ----- */}
            {rings.map(({ r, thick }, idx) => (
              <circle
                key={idx}
                cx={cx}
                cy={centerY}
                r={r - thick / 2}
                stroke="url(#grad)"
                strokeWidth={thick}
                fill="none"
                filter="url(#ringShadow)"
              />
            ))}

            {/* ----- NAPIS NA NAJWIĘKSZYM ----- */}
            <text fontSize="84" fontWeight="bold" letterSpacing="2">
              <textPath
                href="#outerPath"
                startOffset="75%" /* przesunięcie wzdłuż okręgu */
                textAnchor="middle"
                dominantBaseline="middle"
              >
                <tspan fill="#fff">Hold</tspan>
                <tspan fill="#fff">&nbsp;&amp;&nbsp;</tspan>
                <tspan fill="#8F5BFF">Have</tspan>
              </textPath>
            </text>
          </svg>
        </Box>
      </Box>
    </Box>
  );
}
