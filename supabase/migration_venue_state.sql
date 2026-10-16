-- Adds the Indian state each venue is in, so the destination dropdowns
-- (home search box and Explore) can list states instead of cities.
-- Safe to re-run: the column is added only if missing and only empty values are filled.

alter table public.venues add column if not exists state text;

update public.venues v
set state = m.state
from (values
  ('Agra','Uttar Pradesh'),('Bekal','Kerala'),('Bengaluru','Karnataka'),
  ('Bishangarh','Rajasthan'),('Chail','Himachal Pradesh'),('Chennai','Tamil Nadu'),
  ('Goa','Goa'),('Gurugram','Haryana'),('Hyderabad','Telangana'),
  ('Jaipur','Rajasthan'),('Jaisalmer','Rajasthan'),('Jodhpur','Rajasthan'),
  ('Kochi','Kerala'),('Kovalam','Kerala'),('Kozhikode','Kerala'),
  ('Kumarakom','Kerala'),('Manali','Himachal Pradesh'),('Mumbai','Maharashtra'),
  ('Mussoorie','Uttarakhand'),('Narendra Nagar','Uttarakhand'),('New Delhi','Delhi'),
  ('Rishikesh','Uttarakhand'),('Sawai Madhopur','Rajasthan'),('Shimla','Himachal Pradesh'),
  ('Udaipur','Rajasthan'),('Wayanad','Kerala')
) as m(destination, state)
where v.destination = m.destination
  and (v.state is null or v.state = '');
