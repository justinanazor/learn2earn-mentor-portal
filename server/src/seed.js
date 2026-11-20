import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Fellow from './models/Fellow.js';
const names = [
'Chinaecherem McGeorge','Rachael Okafor','Oluwatobiloba Ayinmiro','Joshua Ikeh','Enenche Owoicho','Chinaza Ofojebe','Jude Omoja','Oluchi Kalu','Samuel Adokwu','Success Onyeike','Peter Okoh','Ushahemba Anumtyo','David Ayuba','John Idoghor','Veronica Alhassan','Williams Atubu','Godwin Ugbabe','Abdulrazak Yahaya','Sunday Okoko','Olayinka Samuel Ojo','Kamolideen Gbenle','Kosisochukwu Ezeh','Gift Monday','Gloria Okpara','Godwin Akor','Victor Isaac','Joy Thomas','Blessing Fawole','Solomon Adebayo','Michael Unogwu','Daniel Inalegwu','Friday Igoche','Onyeka Nwanna','Endurance Agui','Mark Donald','David Achimugu','Josephine Ishaya','Victor Alabi','Joshua Odigbo','Chioma Ofojebe','Sarah David','Ifeoma Umenzeakor','Shadrach Samuel'];
const groupANames = [
'Samuel Akoji','Itohowo Thomas','Susan Tolorunlogo','Daniel Sunday','Chinazaekpere Enoh','Raymond Gaius','Promise Chukwuma','Rachael Mfon','Enyo-ojo Meyanga','Maudline Inno-Okoli','Divine Raphael','Emmanuel Inyang','Lawrence Elema','Gideon Dambo','Chiemela Emmanuel','David Ichugh','Ogechukwu Akah','Lovette Duke','Justice Okpayi','Samuel Ameh','Joy Zakariah','Alex Adebanjo','Joshua Osayamen','Yusuf Raji','Effiong Okwong','Maria Adams','Hannah Lawal','Miracle Inyama','Prevail Onuoha','Rose Ameh','Cynthia Isa Zoaka','Onoja Adams','Chibueze Maxwell','Michael Adetunji','Osazuwa Ogbebor','Joseph Otokpa','Trust Olorunfemi','Goodness Iroegbu','Sadiq Abubakar','Courage Olaoluwa','Jeffrey Airiagbon','Ismail Adam','Andrew Friday','Samuel Emmanuel','Chidiebere Opara'];
// Stable randomized split: 22 assigned to Justin, 21 to Valentine. Edit assignments in the portal later.
const justin = new Set(['Chinaecherem McGeorge','Joshua Ikeh','Chinaza Ofojebe','Samuel Adokwu','Ushahemba Anumtyo','John Idoghor','Williams Atubu','Sunday Okoko','Kamolideen Gbenle','Gift Monday','Godwin Akor','Joy Thomas','Solomon Adebayo','Friday Igoche','Mark Donald','Josephine Ishaya','Joshua Odigbo','Sarah David','Rachael Okafor','Jude Omoja','David Ayuba','Victor Alabi']);
await connectDB();
const adminEmail=(process.env.ADMIN_EMAIL||'admin@learn2earn.local').toLowerCase();
const adminPassword=process.env.ADMIN_PASSWORD||'ChangeMe123!';
await User.updateOne({email:adminEmail},{$set:{name:process.env.ADMIN_NAME||'Campus Administrator',password:await bcrypt.hash(adminPassword,12),role:'admin',groups:[],active:true}},{upsert:true});
for(const [i,name] of names.entries()) await Fellow.updateOne({name,group:'Group B'},{$setOnInsert:{fellowId:`GB-${String(i+1).padStart(3,'0')}`,name,group:'Group B',campus:'Abuja',assignedMentor:justin.has(name)?'Justin':'Valentine'}},{upsert:true});
for(const [i,name] of groupANames.entries()) await Fellow.updateOne({name,group:'Group A'},{$setOnInsert:{fellowId:`GA-${String(i+1).padStart(3,'0')}`,name,group:'Group A',campus:'Abuja',assignedMentor:i%2===0?'Moses':'Wisdom'}},{upsert:true});
for(const [name,role,group] of [['Justin','mentor','Group B'],['Valentine','mentor','Group B'],['Moses','mentor','Group A'],['Wisdom','mentor','Group A']]) {
 const email=name.toLowerCase()+'@learn2earn.local';
 await User.updateOne({email},{$setOnInsert:{name,email,password:await bcrypt.hash('ChangeMe123!',12),role,active:true},$addToSet:{groups:group}},{upsert:true});
}
console.log(`Seed complete: ${names.length} Group B fellows and ${groupANames.length} Group A fellows. Justin ${justin.size}; Valentine ${names.length-justin.size}; Moses ${Math.ceil(groupANames.length/2)}; Wisdom ${Math.floor(groupANames.length/2)}.`);
console.log(`Admin login: ${adminEmail} / ${adminPassword} (change this immediately)`);
process.exit(0);
