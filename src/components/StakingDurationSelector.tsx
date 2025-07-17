import React from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Box,
} from "@mui/material";

const WEEK = 7 * 24 * 60 * 60;
const MONTH = 4 * WEEK;
const YEAR = 52 * WEEK;

const predefinedDurations = [
  { label: "1 Month", value: 1 * MONTH },
  { label: "3 Months", value: 3 * MONTH },
  { label: "6 Months", value: 6 * MONTH },
  { label: "1 Year", value: 1 * YEAR },
];

const formatDurationLabel = (weeks: number) => {
  console.log(weeks);
  if (weeks < 4) {
    return `${weeks}w`;
  } else if (weeks < 52) {
    const months = Math.floor(weeks / 4);
    const remainingWeeks = weeks % 4;
    return remainingWeeks > 0 ? `${months}m ${remainingWeeks}w` : `${months}m`;
  } else {
    const years = Math.floor(weeks / 52);
    const remainingMonths = Math.floor((weeks % 52) / 4);
    const remainingWeeks = (weeks % 52) % 4; // Weeks after converting years & months
    let result = `${years}y`;
    if (remainingMonths > 0) result += ` ${remainingMonths}m`;
    if (remainingWeeks > 0) result += ` ${remainingWeeks}w`;
    return result;
  }
};

type StakingDurationSelectorProps = {
  stakeDuration: string;
  setStakeDuration: (value: number) => void;
};

const StakingDurationSelector: React.FC<StakingDurationSelectorProps> = ({
  stakeDuration,
  setStakeDuration,
}) => {
  const [selectedOption, setSelectedOption] = React.useState(
    predefinedDurations.some((opt) => opt.value === Number(stakeDuration))
      ? stakeDuration
      : "custom"
  );

  const handleDurationChange = (event: any) => {
    const value = event.target.value;
    setSelectedOption(value);
    if (value !== "custom") {
      setStakeDuration(Number(value));
    }
  };

  const handleSliderChange = (_: any, newValue: any) => {
    const durationInSeconds = newValue * 7 * 24 * 60 * 60;
    setSelectedOption("custom");
    setStakeDuration(durationInSeconds);
  };
  /*  borderWidth: 2,
        borderStyle: "solid",
        borderColor: "red",*/
  return (
    <FormControl
      component="fieldset"
      fullWidth
      sx={{
        mt: 0,
        mb: 2,
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <FormLabel sx={{ alignSelf: "center" }}>Holding Period</FormLabel>
      <RadioGroup
        row
        value={selectedOption}
        onChange={handleDurationChange}
        sx={{ justifyContent: "center", marginLeft: 0.5, marginRight: -1.5 }}
      >
        {predefinedDurations.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value.toString()}
            control={<Radio />}
            label={option.label}
            sx={{ width: "126px", textAlign: "center" }}
          />
        ))}
      </RadioGroup>
      <Box sx={{ px: 2 }}>
        <Slider
          value={Math.round(Number(stakeDuration) / (7 * 24 * 60 * 60))}
          onChange={handleSliderChange}
          step={1}
          min={2}
          max={104}
          marks={[
            { value: 2, label: "2w" },
            { value: 24, label: "6m" },
            { value: 52, label: "1y" },
            { value: 76, label: "1.5y" },
            { value: 104, label: "2y" },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={formatDurationLabel}
        />
      </Box>
    </FormControl>
  );
};

export default StakingDurationSelector;
