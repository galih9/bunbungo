import { createFileRoute } from "@tanstack/react-router";
import { Chart } from "../pages/Chart";

export const Route = createFileRoute("/chart")({
	component: Chart,
});
