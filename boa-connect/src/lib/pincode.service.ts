// Indian Pincode Lookup Service
export interface PincodeData {
  pincode: string;
  city: string;
  state: string;
  district: string;
  area?: string;
}

class PincodeService {
  private cache = new Map<string, PincodeData>();

  async lookupPincode(pincode: string): Promise<PincodeData | null> {
    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return null;
    }

    // Check cache first
    if (this.cache.has(pincode)) {
      return this.cache.get(pincode)!;
    }

    try {
      // Try multiple APIs for better coverage
      const result = await this.tryMultipleAPIs(pincode);
      
      if (result) {
        // Cache the result
        this.cache.set(pincode, result);
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Pincode lookup error:', error);
      return null;
    }
  }

  private async tryMultipleAPIs(pincode: string): Promise<PincodeData | null> {
    // API 1: India Post API (Free)
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const postOffice = data[0].PostOffice[0];
        return {
          pincode,
          city: postOffice.District,
          state: postOffice.State,
          district: postOffice.District,
          area: postOffice.Name
        };
      }
    } catch (error) {
      console.log('API 1 failed, trying next...');
    }

    // API 2: Zippopotam API (Backup)
    try {
      const response = await fetch(`http://api.zippopotam.us/IN/${pincode}`);
      const data = await response.json();
      
      if (data && data.places && data.places.length > 0) {
        const place = data.places[0];
        return {
          pincode,
          city: place['place name'],
          state: place.state,
          district: place['place name'],
          area: place['place name']
        };
      }
    } catch (error) {
      console.log('API 2 failed, trying fallback...');
    }

    // Fallback: Local database for common pincodes
    return this.getFallbackData(pincode);
  }

  private getFallbackData(pincode: string): PincodeData | null {
    // Common Bihar pincodes (since this is BOA - Bihar Ophthalmic Association)
    const biharPincodes: { [key: string]: PincodeData } = {
      '800001': { pincode: '800001', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800002': { pincode: '800002', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800003': { pincode: '800003', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800004': { pincode: '800004', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800005': { pincode: '800005', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800006': { pincode: '800006', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800007': { pincode: '800007', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800008': { pincode: '800008', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800009': { pincode: '800009', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800010': { pincode: '800010', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800011': { pincode: '800011', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800012': { pincode: '800012', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800013': { pincode: '800013', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800014': { pincode: '800014', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800015': { pincode: '800015', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800016': { pincode: '800016', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800017': { pincode: '800017', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800018': { pincode: '800018', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800019': { pincode: '800019', city: 'Patna', state: 'Bihar', district: 'Patna' },
      '800020': { pincode: '800020', city: 'Patna', state: 'Bihar', district: 'Patna' },
      
      // Gaya
      '823001': { pincode: '823001', city: 'Gaya', state: 'Bihar', district: 'Gaya' },
      '823002': { pincode: '823002', city: 'Gaya', state: 'Bihar', district: 'Gaya' },
      
      // Muzaffarpur
      '842001': { pincode: '842001', city: 'Muzaffarpur', state: 'Bihar', district: 'Muzaffarpur' },
      '842002': { pincode: '842002', city: 'Muzaffarpur', state: 'Bihar', district: 'Muzaffarpur' },
      
      // Bhagalpur
      '812001': { pincode: '812001', city: 'Bhagalpur', state: 'Bihar', district: 'Bhagalpur' },
      '812002': { pincode: '812002', city: 'Bhagalpur', state: 'Bihar', district: 'Bhagalpur' },
      
      // Darbhanga
      '846001': { pincode: '846001', city: 'Darbhanga', state: 'Bihar', district: 'Darbhanga' },
      '846002': { pincode: '846002', city: 'Darbhanga', state: 'Bihar', district: 'Darbhanga' },
      
      // Common other states
      '110001': { pincode: '110001', city: 'New Delhi', state: 'Delhi', district: 'Central Delhi' },
      '400001': { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai City' },
      '700001': { pincode: '700001', city: 'Kolkata', state: 'West Bengal', district: 'Kolkata' },
      '560001': { pincode: '560001', city: 'Bangalore', state: 'Karnataka', district: 'Bangalore Urban' },
      '600001': { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
      '500001': { pincode: '500001', city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad' },
      '380001': { pincode: '380001', city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad' },
      '302001': { pincode: '302001', city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' },
      '226001': { pincode: '226001', city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' },
      '160001': { pincode: '160001', city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' },
    };

    return biharPincodes[pincode] || null;
  }

  // Get suggestions for partial pincode
  getSuggestions(partialPincode: string): string[] {
    if (partialPincode.length < 3) return [];
    
    const suggestions: string[] = [];
    
    // Bihar pincodes start with 8
    if (partialPincode.startsWith('8')) {
      const biharPrefixes = ['800', '801', '802', '803', '804', '805', '806', '807', '808', '809', 
                            '810', '811', '812', '813', '814', '815', '816', '817', '818', '819',
                            '820', '821', '822', '823', '824', '825', '826', '827', '828', '829',
                            '830', '831', '832', '833', '834', '835', '836', '837', '838', '839',
                            '840', '841', '842', '843', '844', '845', '846', '847', '848', '849',
                            '850', '851', '852', '853', '854', '855', '856', '857', '858', '859'];
      
      biharPrefixes.forEach(prefix => {
        if (prefix.startsWith(partialPincode)) {
          suggestions.push(prefix + '001');
        }
      });
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }
}

export const pincodeService = new PincodeService();