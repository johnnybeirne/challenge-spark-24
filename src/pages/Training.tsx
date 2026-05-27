import { Navigate } from "react-router-dom";

// Day 1 entry — routes users into the assessment flow (business/professional
// assessment + quiz). After results, the user lands in the challenge setup.
const Training = () => <Navigate to="/assessment" replace />;

export default Training;
