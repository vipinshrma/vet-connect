import { Review } from '../types';

export const mockReviews: Review[] = [
  // Reviews for Dr. Sarah Johnson (vet-1)
  {
    id: 'review-1',
    userId: 'user-1',
    veterinarianId: 'vet-1',
    clinicId: 'clinic-1',
    appointmentId: 'appointment-1',
    rating: 5,
    comment: 'Dr. Johnson was absolutely wonderful with my golden retriever. She took the time to explain everything and made both me and my dog feel comfortable. The clinic is clean and well-organized.',
    createdAt: new Date('2024-01-10')
  },
  {
    id: 'review-2',
    userId: 'user-2',
    veterinarianId: 'vet-1',
    clinicId: 'clinic-1',
    appointmentId: 'appointment-2',
    rating: 5,
    comment: 'Excellent care for my cat\'s annual checkup. Dr. Johnson is very knowledgeable and gentle. The staff is friendly and efficient. Highly recommend!',
    createdAt: new Date('2024-01-08')
  },
  {
    id: 'review-3',
    userId: 'user-3',
    veterinarianId: 'vet-1',
    clinicId: 'clinic-1',
    appointmentId: 'appointment-3',
    rating: 4,
    comment: 'Great experience overall. Dr. Johnson was thorough in her examination. The only downside was the wait time, but the quality of care made up for it.',
    createdAt: new Date('2024-01-05')
  },

  // Reviews for Dr. Michael Chen (vet-2) - Emergency vet
  {
    id: 'review-4',
    userId: 'user-4',
    veterinarianId: 'vet-2',
    clinicId: 'clinic-2',
    appointmentId: 'appointment-4',
    rating: 5,
    comment: 'Dr. Chen saved my dog\'s life during an emergency. His quick thinking and expertise were incredible. The emergency team was professional and caring during a very stressful time.',
    createdAt: new Date('2024-01-12')
  },
  {
    id: 'review-5',
    userId: 'user-5',
    veterinarianId: 'vet-2',
    clinicId: 'clinic-2',
    appointmentId: 'appointment-5',
    rating: 5,
    comment: 'Brought my cat in for emergency surgery. Dr. Chen and his team were amazing. They kept me informed throughout the procedure and provided excellent post-op care.',
    createdAt: new Date('2024-01-09')
  },
  {
    id: 'review-6',
    userId: 'user-6',
    veterinarianId: 'vet-2',
    clinicId: 'clinic-2',
    appointmentId: 'appointment-6',
    rating: 4,
    comment: 'Emergency visit was handled well. Dr. Chen was knowledgeable and the facilities were top-notch. The cost was high, but expected for emergency care.',
    createdAt: new Date('2024-01-06')
  },

  // Reviews for Dr. Emily Rodriguez (vet-3) - Cardiologist
  {
    id: 'review-7',
    userId: 'user-7',
    veterinarianId: 'vet-3',
    clinicId: 'clinic-3',
    appointmentId: 'appointment-7',
    rating: 5,
    comment: 'Dr. Rodriguez is an exceptional cardiologist. She diagnosed my dog\'s heart condition and created an excellent treatment plan. Her expertise is evident.',
    createdAt: new Date('2024-01-14')
  },
  {
    id: 'review-8',
    userId: 'user-8',
    veterinarianId: 'vet-3',
    clinicId: 'clinic-3',
    appointmentId: 'appointment-8',
    rating: 5,
    comment: 'Outstanding care for my senior cat. Dr. Rodriguez is patient, thorough, and genuinely cares about animals. The clinic has state-of-the-art equipment.',
    createdAt: new Date('2024-01-11')
  },
  {
    id: 'review-9',
    userId: 'user-9',
    veterinarianId: 'vet-3',
    clinicId: 'clinic-3',
    appointmentId: 'appointment-9',
    rating: 5,
    comment: 'Best veterinary cardiologist in the city. Dr. Rodriguez\'s treatment saved my dog\'s life. The staff is professional and the facility is excellent.',
    createdAt: new Date('2024-01-07')
  },

  // Reviews for Dr. James Park (vet-4) - Surgeon
  {
    id: 'review-10',
    userId: 'user-10',
    veterinarianId: 'vet-4',
    clinicId: 'clinic-4',
    appointmentId: 'appointment-10',
    rating: 4,
    comment: 'Dr. Park performed surgery on my dog\'s leg. The procedure went well and recovery was smooth. He explained everything clearly and was very professional.',
    createdAt: new Date('2024-01-13')
  },
  {
    id: 'review-11',
    userId: 'user-11',
    veterinarianId: 'vet-4',
    clinicId: 'clinic-4',
    appointmentId: 'appointment-11',
    rating: 5,
    comment: 'Excellent surgical skills. Dr. Park removed a tumor from my cat successfully. The follow-up care was thorough and my pet recovered perfectly.',
    createdAt: new Date('2024-01-04')
  },

  // Reviews for Dr. Lisa Thompson (vet-5) - Dermatologist
  {
    id: 'review-12',
    userId: 'user-12',
    veterinarianId: 'vet-5',
    clinicId: 'clinic-5',
    appointmentId: 'appointment-12',
    rating: 5,
    comment: 'Dr. Thompson finally solved my dog\'s chronic skin issues. Her expertise in dermatology is impressive. The treatment plan worked perfectly.',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'review-13',
    userId: 'user-13',
    veterinarianId: 'vet-5',
    clinicId: 'clinic-5',
    appointmentId: 'appointment-13',
    rating: 4,
    comment: 'Good experience with my cat\'s allergy treatment. Dr. Thompson was knowledgeable, though it took a few visits to find the right solution.',
    createdAt: new Date('2024-01-03')
  },

  // Reviews for Dr. Robert Kim (vet-6) - General practice
  {
    id: 'review-14',
    userId: 'user-14',
    veterinarianId: 'vet-6',
    clinicId: 'clinic-6',
    appointmentId: 'appointment-14',
    rating: 4,
    comment: 'Dr. Kim provides solid general care. My pets always receive good treatment. The clinic is conveniently located and staff is friendly.',
    createdAt: new Date('2024-01-16')
  },
  {
    id: 'review-15',
    userId: 'user-15',
    veterinarianId: 'vet-6',
    clinicId: 'clinic-6',
    appointmentId: 'appointment-15',
    rating: 4,
    comment: 'Reliable veterinary care. Dr. Kim is thorough with examinations and dental cleanings. Good value for the services provided.',
    createdAt: new Date('2024-01-02')
  },

  // Reviews for Dr. Amanda Foster (vet-7) - Emergency
  {
    id: 'review-16',
    userId: 'user-16',
    veterinarianId: 'vet-7',
    clinicId: 'clinic-7',
    appointmentId: 'appointment-16',
    rating: 5,
    comment: 'Dr. Foster handled my pet\'s poisoning emergency expertly. Quick response, excellent treatment, and compassionate care during a crisis.',
    createdAt: new Date('2024-01-17')
  },
  {
    id: 'review-17',
    userId: 'user-17',
    veterinarianId: 'vet-7',
    clinicId: 'clinic-7',
    appointmentId: 'appointment-17',
    rating: 4,
    comment: 'Professional emergency care. Dr. Foster was calm and efficient during our urgent visit. The facility is well-equipped for emergencies.',
    createdAt: new Date('2024-01-01')
  },

  // Reviews for Dr. David Martinez (vet-8) - Behavioral medicine
  {
    id: 'review-18',
    userId: 'user-18',
    veterinarianId: 'vet-8',
    clinicId: 'clinic-8',
    appointmentId: 'appointment-18',
    rating: 5,
    comment: 'Dr. Martinez transformed my aggressive rescue dog through behavioral therapy. His holistic approach and patience made all the difference.',
    createdAt: new Date('2024-01-18')
  },
  {
    id: 'review-19',
    userId: 'user-19',
    veterinarianId: 'vet-8',
    clinicId: 'clinic-8',
    appointmentId: 'appointment-19',
    rating: 5,
    comment: 'Excellent behavioral consultation. Dr. Martinez helped with my cat\'s anxiety issues using natural and alternative methods. Highly recommended.',
    createdAt: new Date('2023-12-28')
  },

  // Reviews for Dr. Jennifer Lee (vet-9) - Pediatric care
  {
    id: 'review-20',
    userId: 'user-20',
    veterinarianId: 'vet-9',
    clinicId: 'clinic-1',
    appointmentId: 'appointment-20',
    rating: 4,
    comment: 'Dr. Lee is great with puppies and kittens. She provided excellent care for my new puppy\'s vaccinations and health check.',
    createdAt: new Date('2024-01-19')
  }
];

// Helper functions for review data
export const getReviewsByVeterinarian = (veterinarianId: string): Review[] => {
  return mockReviews.filter(review => review.veterinarianId === veterinarianId);
};

export const getReviewsByClinic = (clinicId: string): Review[] => {
  return mockReviews.filter(review => review.clinicId === clinicId);
};

export const getReviewsByUser = (userId: string): Review[] => {
  return mockReviews.filter(review => review.userId === userId);
};

export const getAverageRating = (veterinarianId: string): number => {
  const vetReviews = getReviewsByVeterinarian(veterinarianId);
  if (vetReviews.length === 0) return 0;
  
  const totalRating = vetReviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((totalRating / vetReviews.length) * 10) / 10; // Round to 1 decimal place
};

export const getRecentReviews = (limit: number = 10): Review[] => {
  return [...mockReviews]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
};

export const getTopRatedReviews = (minRating: number = 4): Review[] => {
  return mockReviews
    .filter(review => review.rating >= minRating)
    .sort((a, b) => b.rating - a.rating);
};

// Review statistics
export const getReviewStats = () => {
  const totalReviews = mockReviews.length;
  const ratings = mockReviews.map(review => review.rating);
  const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews;
  
  const ratingCounts = {
    5: ratings.filter(r => r === 5).length,
    4: ratings.filter(r => r === 4).length,
    3: ratings.filter(r => r === 3).length,
    2: ratings.filter(r => r === 2).length,
    1: ratings.filter(r => r === 1).length
  };

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingCounts
  };
};