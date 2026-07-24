import { useEffect, useState } from 'react';
import { Building2, Save, X } from 'lucide-react';
import { Partner, partnersService } from '../../services/admin.service';
import { supabase } from '../../lib/supabase';

const businessTypes = [['veterinary','Veterinaria'],['grooming','Peluquería'],['walking','Paseador'],['boarding','Pensión'],['shop','Tienda'],['shelter','Refugio']];

export default function PartnerProfileModal({ partner, onClose, onSaved }: { partner: Partner; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    business_name: partner.business_name || '', business_type: partner.business_type || '',
    description: partner.description || '', email: partner.email || '', phone: partner.phone || '',
    rut: partner.rut || '', calle: partner.calle || '', numero: partner.numero || '',
    barrio: partner.barrio || '', codigo_postal: partner.codigo_postal || '',
    country_id: partner.country_id || '', department_id: partner.department_id || '',
    latitud: String(partner.latitud ?? ''), longitud: String(partner.longitud ?? ''),
    logo: partner.logo || '', image: partner.images?.[0] || '',
    iva_rate: String(partner.iva_rate ?? 0), iva_included_in_price: Boolean(partner.iva_included_in_price),
    has_shipping: Boolean(partner.has_shipping), shipping_cost: String(partner.shipping_cost ?? 0),
    free_shipping_threshold: String(partner.free_shipping_threshold ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const set = (key: string, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    supabase.from('countries').select('id,name').order('name').then(({ data }) => setCountries(data || []));
  }, []);

  useEffect(() => {
    if (!form.country_id) {
      setDepartments([]);
      return;
    }
    supabase.from('departments').select('id,name').eq('country_id', form.country_id).order('name').then(({ data }) => setDepartments(data || []));
  }, [form.country_id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const country = countries.find(item => item.id === form.country_id)?.name;
      const department = departments.find(item => item.id === form.department_id)?.name;
      const simpleAddress = [
        `${form.calle.trim()} ${form.numero.trim()}`.trim(),
        form.barrio.trim(),
        department,
        country,
      ].filter(Boolean).join(', ');
      await partnersService.updateProfile(partner.id, {
        business_name: form.business_name.trim(), business_type: form.business_type,
        description: form.description.trim(), email: form.email.trim(), phone: form.phone.trim(),
        rut: form.rut.trim(), calle: form.calle.trim(), numero: form.numero.trim(),
        barrio: form.barrio.trim() || null, codigo_postal: form.codigo_postal.trim() || null,
        country_id: form.country_id || null, department_id: form.department_id || null,
        latitud: form.latitud.trim() || null, longitud: form.longitud.trim() || null,
        logo: form.logo.trim() || null, images: form.image.trim() ? [form.image.trim()] : partner.images,
        address: simpleAddress || partner.address, iva_rate: Number(form.iva_rate) || 0,
        iva_included_in_price: form.iva_included_in_price, has_shipping: form.has_shipping,
        shipping_cost: form.has_shipping ? Number(form.shipping_cost) || 0 : 0,
        free_shipping_threshold: form.has_shipping ? Number(form.free_shipping_threshold) || 0 : 0,
      });
      onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el perfil.'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#183432]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="partner-profile-title">
    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#fffdf8] shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#2D6A6F]/15 bg-[#fffdf8]/95 px-6 py-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#DCEBE7] text-[#2D6A6F]"><Building2 /></span><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#4B9991]">Ficha del aliado</p><h2 id="partner-profile-title" className="text-2xl font-bold text-[#183432]">Información comercial</h2></div></div>
        <button onClick={onClose} className="rounded-full p-2 text-[#58716d] hover:bg-[#DCEBE7]" aria-label="Cerrar"><X /></button>
      </div>
      <form onSubmit={submit} className="p-6 md:p-9">
        <p className="mb-8 max-w-2xl text-[#58716d]">Estos campos coinciden con el registro móvil de DogCatiFy y alimentan la ficha pública del negocio.</p>
        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Nombre comercial *"><input required value={form.business_name} onChange={e=>set('business_name',e.target.value)}/></Field>
          <Field label="Tipo de negocio *"><select required value={form.business_type} onChange={e=>set('business_type',e.target.value)}>{businessTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Correo *"><input type="email" required value={form.email} onChange={e=>set('email',e.target.value)}/></Field>
          <Field label="Teléfono *"><input type="tel" required value={form.phone} onChange={e=>set('phone',e.target.value)}/></Field>
          <Field label="RUT *"><input required value={form.rut} onChange={e=>set('rut',e.target.value)}/></Field>
          <Field label="Código postal"><input value={form.codigo_postal} onChange={e=>set('codigo_postal',e.target.value)}/></Field>
          <Field label="País"><select value={form.country_id} onChange={e=>{set('country_id',e.target.value);set('department_id','');}}><option value="">Seleccionar país</option>{countries.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Departamento"><select value={form.department_id} onChange={e=>set('department_id',e.target.value)}><option value="">Seleccionar departamento</option>{departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Calle *"><input required value={form.calle} onChange={e=>set('calle',e.target.value)}/></Field>
          <Field label="Número *"><input required value={form.numero} onChange={e=>set('numero',e.target.value)}/></Field>
          <Field label="Barrio"><input value={form.barrio} onChange={e=>set('barrio',e.target.value)}/></Field>
          <Field label="Latitud"><input inputMode="decimal" value={form.latitud} onChange={e=>set('latitud',e.target.value)}/></Field>
          <Field label="Longitud"><input inputMode="decimal" value={form.longitud} onChange={e=>set('longitud',e.target.value)}/></Field>
          <Field label="IVA (%)"><input type="number" min="0" step="0.01" value={form.iva_rate} onChange={e=>set('iva_rate',e.target.value)}/></Field>
          <Field label="URL del logo"><input type="url" value={form.logo} onChange={e=>set('logo',e.target.value)}/></Field>
          <Field label="URL de imagen principal"><input type="url" value={form.image} onChange={e=>set('image',e.target.value)}/></Field>
          <div className="md:col-span-2"><Field label="Descripción *"><textarea required rows={4} value={form.description} onChange={e=>set('description',e.target.value)}/></Field></div>
        </div>
        <div className="mt-8 grid gap-4 rounded-2xl bg-[#DCEBE7]/65 p-5 md:grid-cols-2">
          <Toggle label="Los precios incluyen IVA" checked={form.iva_included_in_price} onChange={value=>set('iva_included_in_price',value)}/>
          <Toggle label="Ofrece envíos" checked={form.has_shipping} onChange={value=>set('has_shipping',value)}/>
          {form.has_shipping && <><Field label="Costo de envío"><input type="number" min="0" value={form.shipping_cost} onChange={e=>set('shipping_cost',e.target.value)}/></Field><Field label="Envío gratis desde"><input type="number" min="0" value={form.free_shipping_threshold} onChange={e=>set('free_shipping_threshold',e.target.value)}/></Field></>}
        </div>
        <div className="mt-8 flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" onClick={onClose} className="rounded-xl border border-[#2D6A6F] px-6 py-3 font-bold text-[#2D6A6F]">Cancelar</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D6A6F] px-6 py-3 font-bold text-white disabled:opacity-50"><Save size={18}/>{saving?'Guardando...':'Guardar perfil'}</button></div>
      </form>
    </div>
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="grid gap-2 text-sm font-bold text-[#183432]">{label}<span className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-[#2D6A6F]/25 [&>input]:bg-white [&>input]:px-4 [&>input]:py-3 [&>input]:font-normal [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-[#2D6A6F]/25 [&>select]:bg-white [&>select]:px-4 [&>select]:py-3 [&>select]:font-normal [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-[#2D6A6F]/25 [&>textarea]:bg-white [&>textarea]:px-4 [&>textarea]:py-3 [&>textarea]:font-normal">{children}</span></label> }
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}) { return <label className="flex items-center gap-3 font-bold text-[#183432]"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="h-5 w-5 accent-[#2D6A6F]"/>{label}</label> }
