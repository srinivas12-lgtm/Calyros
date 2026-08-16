import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Access onboarding store
  let onboardingStore = null;
  try {
    // We try/catch in case someone uses this outside the provider, though it shouldn't happen
    onboardingStore = useOnboardingStore();
  } catch (e) {
    console.warn("Not inside OnboardingProvider");
  }

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    
    // Simple placeholder for Google SSO
    if (!email || !password || (isSignUp && !fullName)) {
      if (e.target.type === 'button') {
        // Assume Google SSO bypass for demo purposes since it's hardcoded in button click
        return; 
      }
    }
    
    try {
      if (isSignUp) {
        await apiClient.post('/auth/register', { email, password, full_name: fullName });
      }

      console.log("Login started");
      console.log("API Base URL:", apiClient.defaults.baseURL);
      console.log("Payload:", { email });
      
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      
      const resp = await apiClient.post('/auth/login', formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      console.log("Response:", resp);
      
      if (resp.data.access_token) {
        login(resp.data.access_token);
        
        // If we have onboarding data, submit it now!
        let createdProfileFromOnboarding = false;
        if (onboardingStore && onboardingStore.data && onboardingStore.data.completedSteps && onboardingStore.data.completedSteps.length > 0) {
          const obData = onboardingStore.data;
          
          // Map frontend state to backend schema
          const payload = {
            full_name: fullName || undefined,
            profile: {
              age: obData.age ? parseInt(obData.age, 10) : undefined,
              gender: obData.gender || undefined,
              height_cm: obData.height ? parseFloat(obData.height) : undefined,
              weight_kg: obData.weight ? parseFloat(obData.weight) : undefined,
              activity_level: obData.activity || undefined,
              health_goal: obData.goals || undefined,
              diet_type: obData.diet || undefined
            },
            health_conditions: {
              diabetes: obData.health.includes('diabetes'),
              hypertension: obData.health.includes('high-bp'),
              cholesterol: obData.health.includes('high-cholesterol'),
              kidney_disease: obData.health.includes('kidney-disease'),
              liver_disease: obData.health.includes('liver-disease'),
              thyroid_disorder: obData.health.includes('thyroid'),
              heart_disease: obData.health.includes('heart-disease'),
              pcos: obData.health.includes('pcos'),
              other_conditions: obData.healthOther || undefined
            },
            allergies: {
              milk: obData.allergies.includes('dairy'),
              gluten: obData.allergies.includes('gluten'),
              soy: obData.allergies.includes('soy'),
              nuts: obData.allergies.includes('nuts'),
              eggs: obData.allergies.includes('eggs'),
              seafood: obData.allergies.includes('fish'),
              shellfish: obData.allergies.includes('shellfish'),
              other_allergies: obData.allergiesOther || undefined
            },
            preferences: {
              vegan: obData.diet === 'vegan',
              vegetarian: obData.diet === 'vegetarian',
              keto: obData.diet === 'keto',
              halal: obData.diet === 'halal'
            }
          };

          try {
            await apiClient.post('/profile/create', payload, {
              headers: { Authorization: `Bearer ${resp.data.access_token}` }
            });
            onboardingStore.clearData();
            createdProfileFromOnboarding = true;
          } catch (profileErr) {
            console.error("Failed to save profile data:", profileErr);
          }
        }
        
        if (createdProfileFromOnboarding) {
          navigate('/dashboard');
        } else {
          // Check if user has a profile
          try {
            const meResp = await apiClient.get('/auth/me', {
              headers: { Authorization: `Bearer ${resp.data.access_token}` }
            });
            if (meResp.data.has_profile) {
              navigate('/dashboard');
            } else {
              navigate('/onboarding/age');
            }
          } catch (e) {
            console.error("Failed to fetch user profile status", e);
            navigate('/dashboard'); // fallback
          }
        }
      } else {
        setError('Login failed. No access token received.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      if (err.response && err.response.data) {
        // Extract exact detail message if provided by FastAPI
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail[0]?.msg || 'Validation error');
        } else if (err.response.data.error?.message) {
          setError(err.response.data.error.message);
        } else {
          setError(err.response.data.message || 'Failed to authenticate');
        }
      } else {
        setError('Failed to authenticate. Server might be unreachable.');
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    let animationFrameId;
    
    function init() {
        resize();
        createParticles();
        loop();
    }
    
    function resize() {
        width = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    const handleResize = () => {
        resize();
        createParticles();
    };
    
    window.addEventListener('resize', handleResize);
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.5 + 0.5;
            this.baseSize = this.size;
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    function createParticles() {
        particles = [];
        const density = Math.floor((width * height) / 15000);
        for (let i = 0; i < density; i++) {
            particles.push(new Particle());
        }
    }
    
    let mouseX = width / 2;
    let mouseY = height / 2;
    
    const handleMouseMove = (e) => {
        const rect = canvas.parentElement.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    };
    
    canvas.parentElement.addEventListener('mousemove', handleMouseMove);
    
    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
            
            const dxm = particles[i].x - mouseX;
            const dym = particles[i].y - mouseY;
            const distm = Math.sqrt(dxm * dxm + dym * dym);
            
            if (distm < 130) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * (1 - distm / 130)})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouseX, mouseY);
                ctx.stroke();
            }
        }
    }
    
    function loop() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        
        drawLines();
        animationFrameId = requestAnimationFrame(loop);
    }
    
    init();

    return () => {
        window.removeEventListener('resize', handleResize);
        if (canvas.parentElement) {
            canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
        }
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <style>{`
        .login-override-bg {
            background-color: #050505;
            color: #e5e2e1;
        }
        
        .login-override-bg .glass-panel {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 30px 60px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
            border-radius: 24px;
        }
        
        .login-override-bg .glass-input {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 9999px;
            padding-left: 1.25rem;
            padding-right: 1.25rem;
            transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        
        .login-override-bg .glass-input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(255, 255, 255, 0.25);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .login-override-bg .btn-glass {
            background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 9999px;
            color: #ffffff;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        
        .login-override-bg .btn-glass:hover {
            background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255,255,255,0.2);
            transform: translateY(-2px);
        }

        .login-override-bg .btn-glass-primary {
            background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 9999px;
            color: #ffffff;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 8px 30px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        
        .login-override-bg .btn-glass-primary:hover {
            background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%);
            border-color: rgba(255, 255, 255, 0.4);
            box-shadow: 0 12px 35px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }

        .login-override-bg #particle-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        }
        
        .login-override-bg .content-layer {
            position: relative;
            z-index: 10;
        }

        .login-override-bg .text-gradient {
            background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.6) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
      `}</style>

      <div className="login-override-bg min-h-screen flex items-center justify-center font-body-md text-body-md overflow-hidden relative z-[100]">
        <div className="w-full h-screen flex flex-col md:flex-row">
          {/* Left Side: Branding & Visuals */}
          <div className="relative w-full md:w-1/2 h-full hidden md:flex flex-col justify-center items-center overflow-hidden bg-surface-container-lowest">
            {/* Particle Canvas */}
            <canvas id="particle-canvas" ref={canvasRef}></canvas>
            
            {/* Branding Content */}
            <div className="content-layer text-center px-xl max-w-lg">
              <div className="mb-lg flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>memory</span>
                </div>
              </div>
              <h1 className="font-display-lg text-display-lg text-gradient mb-md">Calyros AI</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Your Personal Food Intelligence System.</p>
              <div className="mt-xl flex gap-sm justify-center">
                <div className="px-sm py-xs bg-surface border border-white/5 rounded-full font-label-sm text-label-sm text-on-surface-variant backdrop-blur-md">v2.4.0-rc</div>
                <div className="px-sm py-xs bg-surface border border-white/5 rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Systems Operational
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side: Authentication */}
          <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-gutter relative z-10">
            {/* Mobile Branding (hidden on desktop) */}
            <div className="md:hidden text-center mb-xl w-full">
              <div className="mb-md flex justify-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-xl">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>memory</span>
                </div>
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-gradient">Calyros AI</h1>
            </div>
            
            {/* Login Card */}
            <div className="glass-panel p-xl w-full max-w-md">
              <div className="mb-lg">
                <h2 className="font-headline-md text-headline-md text-primary mb-xs">
                  {isSignUp ? 'Create an account' : 'Welcome back'}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {isSignUp ? 'Sign up to start your intelligence dashboard.' : 'Sign in to access your intelligence dashboard.'}
                </p>
              </div>
              
              {/* OAuth */}
              <button 
                className="btn-glass w-full py-3.5 flex items-center justify-center gap-sm mb-lg" 
                onClick={handleAuth}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"></path>
                </svg>
                <span className="font-label-md text-label-md">Continue with Google</span>
              </button>
              
              {/* Divider */}
              <div className="flex items-center gap-sm mb-lg">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="font-label-sm text-label-sm text-outline-variant uppercase tracking-widest">or email</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}
              {/* Form */}
              <form className="space-y-5" onSubmit={handleAuth}>
                {isSignUp && (
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1" htmlFor="fullName">Full Name</label>
                    <input 
                      className="glass-input w-full py-3 text-primary font-body-md focus:ring-0" 
                      id="fullName" 
                      placeholder="John Doe" 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                )}
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1" htmlFor="email">Email Address</label>
                  <input 
                    className="glass-input w-full py-3 text-primary font-body-md focus:ring-0" 
                    id="email" 
                    placeholder="name@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">Password</label>
                    {!isSignUp && <a className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors" href="#">Forgot?</a>}
                  </div>
                  <input 
                    className="glass-input w-full py-3 text-primary font-body-md focus:ring-0" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-2">
                  <button 
                    className="btn-glass-primary w-full py-3.5 font-label-md text-label-md flex justify-center items-center gap-2" 
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
                    {!isLoading && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>}
                  </button>
                </div>
              </form>
              <p className="mt-lg text-center font-body-md text-body-md text-on-surface-variant">
                {isSignUp ? (
                  <>Already have an account? <button type="button" onClick={() => setIsSignUp(false)} className="text-primary hover:underline transition-all font-medium">Sign In</button></>
                ) : (
                  <>Don't have an account? <button type="button" onClick={() => setIsSignUp(true)} className="text-primary hover:underline transition-all font-medium">Sign Up</button></>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
