import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pincodeService, PincodeData } from '@/lib/pincode.service';

interface PincodeInputProps {
  pincode: string;
  city: string;
  state: string;
  onPincodeChange: (pincode: string) => void;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function PincodeInput({
  pincode,
  city,
  state,
  onPincodeChange,
  onCityChange,
  onStateChange,
  required = false,
  className,
  disabled = false
}: PincodeInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const lookupPincode = async () => {
      // Only lookup if pincode is 6 digits
      if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
        setIsLoading(true);
        setLookupStatus('idle');
        setErrorMessage('');

        try {
          const result = await pincodeService.lookupPincode(pincode);
          
          if (result) {
            onCityChange(result.city);
            onStateChange(result.state);
            setLookupStatus('success');
          } else {
            setLookupStatus('error');
            setErrorMessage('Pincode not found. Please enter city and state manually.');
          }
        } catch (error) {
          setLookupStatus('error');
          setErrorMessage('Failed to lookup pincode. Please enter city and state manually.');
        } finally {
          setIsLoading(false);
        }
      } else if (pincode.length > 0 && pincode.length < 6) {
        setLookupStatus('idle');
        setErrorMessage('');
      }
    };

    // Debounce the lookup
    const timeoutId = setTimeout(lookupPincode, 500);
    return () => clearTimeout(timeoutId);
  }, [pincode, onCityChange, onStateChange]);

  const handlePincodeChange = (value: string) => {
    // Only allow digits and max 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    onPincodeChange(cleanValue);
    
    // Reset status when user types
    if (cleanValue.length < 6) {
      setLookupStatus('idle');
      setErrorMessage('');
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    
    switch (lookupStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    if (isLoading) {
      return 'Looking up pincode...';
    }
    
    switch (lookupStatus) {
      case 'success':
        return 'City and state auto-filled';
      case 'error':
        return errorMessage;
      default:
        return 'Enter 6-digit pincode for auto city/state';
    }
  };

  return (
    <div className="space-y-4">
      {/* Pincode Input */}
      <div className="space-y-2">
        <Label htmlFor="pincode">
          Pincode {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <Input
            id="pincode"
            type="text"
            value={pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            required={required}
            disabled={disabled}
            className={cn("pr-10", className)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        <p className={cn(
          "text-xs",
          lookupStatus === 'success' ? 'text-green-600' : 
          lookupStatus === 'error' ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {getStatusMessage()}
        </p>
      </div>

      {/* City and State Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">
            City {required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="city"
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="City"
            required={required}
            disabled={disabled}
            className={cn(
              lookupStatus === 'success' && 'border-green-200 bg-green-50',
              className
            )}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">
            State {required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="state"
            type="text"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="State"
            required={required}
            disabled={disabled}
            className={cn(
              lookupStatus === 'success' && 'border-green-200 bg-green-50',
              className
            )}
          />
        </div>
      </div>
    </div>
  );
}