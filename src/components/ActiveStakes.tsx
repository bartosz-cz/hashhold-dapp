import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
} from "@mui/material";

interface ActiveStakesProps {
  stakedEvents: any[];
  onUnstake: (stakeId: number) => void;
}

const ActiveStakes: React.FC<ActiveStakesProps> = ({
  stakedEvents,
  onUnstake,
}) => {
  return (
    <Grid
      container
      spacing={2}
      justifyContent="center"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {stakedEvents.map((ev, index) => {
        const amount = ev.amount.toString();
        const startDate = new Date(ev.startTime * 1000);
        const endDate = new Date(ev.endTime * 1000);

        const formattedStart = startDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        const formattedEnd = endDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        return (
          <Grid item key={index}>
            <Card sx={{ width: "250px", minWidth: "250px", maxWidth: "250px" }}>
              <CardContent>
                <Typography variant="h6" align="center" noWrap>
                  {amount} {ev.symbol}
                </Typography>
                <br />
                <Typography
                  variant="body2"
                  align="center"
                  color="textSecondary"
                >
                  Staked: {formattedStart}
                  <br />
                  Ends: {formattedEnd}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => onUnstake(ev.stakeId)}
                  fullWidth
                >
                  Unstake
                </Button>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ActiveStakes;
