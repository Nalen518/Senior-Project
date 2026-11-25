import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/modules/dashboard/index";
export default async function Dashboard() {
  return (
    <>
      <Navbar />
      <Hero />
    </>
  );
}
