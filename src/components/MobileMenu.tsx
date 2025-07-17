import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  IconButton,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  alpha,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const pages = [
  { label: "Hold", path: "/hold" },
  { label: "About", path: "/about" },
  { label: "Roadmap", path: "/roadmap" },
];

export default function MobileMenu() {
  const { pathname } = useLocation(); // <- know which page we are on
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const id = open ? "nav-popover" : undefined;

  return (
    <>
      {/* ───── BURGER ─────────────────────────── */}
      <IconButton
        aria-describedby={id}
        edge="end"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          ml: 1,
          color: "#8F5BFF",
          position: "relative",
          "&.Mui-focusVisible, &:focus, &:focus-visible": { outline: "none" },
          ...(open && {
            "::after": {
              // purple ring while open
              content: '""',
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: "2px solid",
              borderColor: "#8F5BFF",
            },
            "&.Mui-focusVisible, &:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* ───── POPOVER MENU ───────────────────── */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 110,
            backgroundColor: "#2A2A2A",
            border: "1px solid #444",
            boxShadow: "0 4px 14px rgba(0,0,0,.45)",
            justifyItems: "center",
          },
        }}
      >
        <List dense disablePadding>
          {pages.map(({ label, path }) => {
            const active = pathname === path; // matches current route
            return (
              <ListItemButton
                key={label}
                component={NavLink}
                to={path}
                onClick={() => setAnchorEl(null)}
                selected={active}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: alpha("#8F5BFF", 0.14),
                    "& .MuiListItemText-primary": {
                      color: "#8F5BFF",
                      fontWeight: 600,
                    },
                    justifyItems: "center",
                  },
                }}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            );
          })}
        </List>
      </Popover>
    </>
  );
}
