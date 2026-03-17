import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserPlus, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pendingApproval, setPendingApproval] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "נא להזין שם מלא";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "השם חייב להכיל לפחות 2 תווים";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "נא להזין כתובת אימייל";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "כתובת אימייל לא תקינה";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "נא להזין סיסמה";
    } else if (formData.password.length < 8) {
      newErrors.password = "הסיסמה חייבת להכיל לפחות 8 תווים";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "נא לאמת את הסיסמה";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "הסיסמאות אינן תואמות";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);

    if (result?.pendingApproval) {
      setPendingApproval(true);
    }

    setIsLoading(false);
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
  };

  const passwordStrength = getPasswordStrength();

  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              בקשת ההרשמה נשלחה
            </CardTitle>
            <CardDescription className="text-center text-base">
              חשבונך נוצר בהצלחה וממתין לאישור מנהל המערכת.
              <br />
              תקבל הודעה כאשר חשבונך יאושר.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/login">
              <Button variant="outline">חזרה לדף ההתחברות</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">הרשמה למערכת</CardTitle>
          <CardDescription className="text-center">
            צור חשבון חדש במערכת Flow Control
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="שם פרטי ושם משפחה"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.email ? "border-destructive" : ""}
                dir="ltr"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="לפחות 8 תווים"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.password ? "border-destructive" : ""}
                dir="ltr"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}

              {/* Password strength indicator */}
              {formData.password && passwordStrength !== null && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength
                            ? passwordStrength <= 2
                              ? "bg-destructive"
                              : passwordStrength <= 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength <= 2 && "חלשה"}
                    {passwordStrength === 3 && "בינונית"}
                    {passwordStrength >= 4 && "חזקה"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="הזן סיסמה שנית"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.confirmPassword ? "border-destructive" : ""}
                dir="ltr"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>הסיסמאות תואמות</span>
                  </div>
                )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  נרשם...
                </>
              ) : (
                <>
                  <UserPlus className="me-2 h-4 w-4" />
                  הירשם
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              כבר יש לך חשבון?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                התחבר כאן
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
