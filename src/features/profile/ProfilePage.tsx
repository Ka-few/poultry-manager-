import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';

const profileSchema = z.object({
  id: z.string(),
  farmerName: z.string().trim().min(2),
  farmName: z.string().trim().min(2),
  farmLocation: z.string().trim().min(2),
  phoneNumber: z.string().optional().default(''),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { data, saveProfile } = useFarmData();
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: data.profile });

  useEffect(() => {
    form.reset(data.profile);
  }, [data.profile, form]);

  const submitProfile = form.handleSubmit((values) => {
    saveProfile({
      ...values,
      farmerName: values.farmerName.trim(),
      farmName: values.farmName.trim(),
      farmLocation: values.farmLocation.trim(),
      phoneNumber: values.phoneNumber?.trim() ?? '',
    });
    setSaved(true);
  });

  return (
    <div className="page-stack">
      <PageHeader title="Farmer profile" eyebrow="Local account" />
      <form className="form-panel narrow" onSubmit={submitProfile}>
        <div className="form-grid single">
          <input type="hidden" {...form.register('id')} />
          <label>Farmer name<input {...form.register('farmerName')} /></label>
          <label>Farm name<input {...form.register('farmName')} /></label>
          <label>Farm location<input {...form.register('farmLocation')} /></label>
          <label>Phone number<input inputMode="tel" {...form.register('phoneNumber')} /></label>
          <button className="primary-button" type="submit"><Save size={20} aria-hidden /> Save profile</button>
          {saved ? <span className="form-status">Profile saved. Reports and app header now use {data.profile.farmName}.</span> : null}
        </div>
      </form>
    </div>
  );
}
