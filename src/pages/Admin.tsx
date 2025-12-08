import { useState, useEffect } from 'react';
import { useFetch } from '@/lib/useFetch';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Girl {
  id?: number;
  name: string;
  age: number;
  origin: string;
  image: string;
  specialties: string[];
  available: boolean;
  description: string;
}

interface Angebot {
  id?: number;
  title: string;
  duration_minutes?: number;
  price?: number;
}

const Admin = () => {
  const { data: girlsData, loading, error } = useFetch<Girl[]>('/profiles');
  const [girls, setGirls] = useState<Girl[]>([]);
  const [editingGirl, setEditingGirl] = useState<Girl | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Update local state when data loads
  useEffect(() => {
    if (girlsData) {
      const girlsArray = Array.isArray(girlsData) ? girlsData : (girlsData as any)?.data || [];
      setGirls(girlsArray);
    }
  }, [girlsData]);

  const handleSave = async (girl: Girl) => {
    const method = girl.id ? 'PUT' : 'POST';
    const url = girl.id ? `/GirlsProfiles/${girl.id}` : '/GirlsProfiles';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(girl),
      });
      if (!res.ok) throw new Error('Failed to save');
      const savedGirl = await res.json();
      if (girl.id) {
        setGirls(girls.map(g => g.id === girl.id ? savedGirl : g));
      } else {
        setGirls([...girls, savedGirl]);
      }
      setIsDialogOpen(false);
      setEditingGirl(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(import.meta.env.VITE_API_BASE, { method: 'DELETE' });
      setGirls(girls.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openEditDialog = (girl: Girl) => {
    setEditingGirl(girl);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingGirl({ name: '', age: 0, origin: '', image: '', specialties: [], available: true, description: '' });
    setIsDialogOpen(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-slate-400">Manage your application data</p>
        </div>
        <Tabs defaultValue="girls" className="w-full">
          <TabsList>
            <TabsTrigger value="girls">Girls Profiles</TabsTrigger>
            <TabsTrigger value="mieterinnen">Mieterinnen</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            {/* Add more tabs as needed */}
          </TabsList>
          <TabsContent value="girls">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Girls Profiles</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddDialog}>Add Girl</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingGirl?.id ? 'Edit' : 'Add'} Girl</DialogTitle>
                  </DialogHeader>
                  <GirlForm girl={editingGirl} onSave={handleSave} />
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {girls.map((girl) => (
                  <TableRow key={girl.id}>
                    <TableCell>{girl.name}</TableCell>
                    <TableCell>{girl.age}</TableCell>
                    <TableCell>{girl.origin}</TableCell>
                    <TableCell>{girl.available ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(girl)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(girl.id!)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="mieterinnen">
            {/* Similar structure for Mieterinnen */}
            <div>Mieterinnen management coming soon...</div>
          </TabsContent>
          <TabsContent value="bookings">
            <BookingCreateForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface GirlFormProps {
  girl: Girl | null;
  onSave: (girl: Girl) => void;
}

const GirlForm = ({ girl, onSave }: GirlFormProps) => {
  const [formData, setFormData] = useState<Girl>(girl || { name: '', age: 0, origin: '', image: '', specialties: [], available: true, description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="age">Age</Label>
        <Input id="age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })} />
      </div>
      <div>
        <Label htmlFor="origin">Origin</Label>
        <Input id="origin" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="specialties">Specialties (comma-separated)</Label>
        <Input id="specialties" value={Array.isArray(formData.specialties) ? formData.specialties.join(', ') : (formData.specialties || '')} onChange={(e) => setFormData({ ...formData, specialties: e.target.value.split(', ') })} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
};

const BookingCreateForm = () => {
  const [profiles, setProfiles] = useState<Girl[]>([]);
  const [angebots, setAngebots] = useState<Angebot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    girl: '',
    service: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch profiles
        const profilesResponse = await fetch(`${import.meta.env.VITE_API_BASE}/profiles`);
        if (profilesResponse.ok) {
          const profilesData = await profilesResponse.json();
          const profilesList = profilesData.data || [];
          setProfiles(profilesList);
        }

        // Fetch angebots
        const angebotResponse = await fetch(`${import.meta.env.VITE_API_BASE}/angebots`);
        if (angebotResponse.ok) {
          const angebotData = await angebotResponse.json();
          const angebotList = angebotData.data || [];
          setAngebots(angebotList);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        alert('Booking created successfully!');
        setBookingData({
          girl: '',
          service: '',
          date: '',
          time: '',
          name: '',
          phone: '',
          email: '',
          message: ''
        });
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    }
  };

  const timeSlots = [
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", 
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Create Booking</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="girl">Masseurin</Label>
            <select
              id="girl"
              name="girl"
              value={bookingData.girl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
              required
            >
              <option value="">Select Masseurin</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.name}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="service">Service</Label>
            <select
              id="service"
              name="service"
              value={bookingData.service}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
              required
            >
              <option value="">Select Service</option>
              {angebots.map((angebot) => (
                <option key={angebot.id} value={angebot.title}>
                  {angebot.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={bookingData.date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <select
              id="time"
              name="time"
              value={bookingData.time}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
              required
            >
              <option value="">Select Time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={bookingData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={bookingData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={bookingData.email}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            name="message"
            value={bookingData.message}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white resize-none"
          />
        </div>

        <Button type="submit">Create Booking</Button>
      </form>
    </div>
  );
};

export default Admin;
