import { HomePage } from "modules/home/pages/HomePage"
import { HomeLayout } from "modules/shared/components/layouts/HomeLayout"

const Home = () => {
  return (
    <HomeLayout transparentNavbar={true}>
      <HomePage />
    </HomeLayout>
  )
}

export default Home
