import { SignUp } from "@clerk/clerk-react";
import './Signup.css';

function Signup() {
    return (
        <div className="signup-page-container">
            <main className="signup-main">        
                <SignUp signInUrl="/login" />
            </main>
        </div>
    );
}

export default Signup;