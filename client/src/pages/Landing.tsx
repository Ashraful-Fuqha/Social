import { useUser } from '@clerk/clerk-react'
import { Link, useNavigate } from 'react-router-dom'

function Landing() {
    const {isSignedIn} = useUser()
    const navigate = useNavigate()
    if(isSignedIn){
      navigate('/home')
    }
      
  return (
          <>
            <div className="absolute w-72 top-[40%] left-[50%] -translate-x-2/4 -translate-y-2/4 text-center">
              <h2 className="text-xl tracking-wider mb-2 text-teal-600 dark:text-rose-400 font-semibold">Please Login to access videos <Link to={'/signin'} className="text-purple-600 font-semibold dark:text-purple-400">Login</Link> Or <Link to={'/signup'} className="text-purple-600 font-semibold dark:text-purple-400">Signup</Link></h2>
            </div>
          </>
        )
}

export default Landing


{/* <div className="absolute w-64 top-[40%] left-[50%] -translate-x-2/4 -translate-y-2/4 text-center">
              <h2 className="text-xl tracking-wider mb-2 text-teal-600 dark:text-rose-400 font-semibold">No Videos for you</h2>
              <p className="tracking-wide">You have an opportunity to start with us</p>
            </div> */}