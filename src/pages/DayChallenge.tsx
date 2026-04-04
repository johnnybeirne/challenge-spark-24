import { useParams } from "react-router-dom";

const DayChallenge = () => {
  const { day } = useParams<{ day: string }>();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Day {day}</h1>
      <p className="text-muted-foreground">Challenge day {day} — coming soon</p>
    </div>
  );
};
export default DayChallenge;
