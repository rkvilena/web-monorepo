'use client';

import { useCurrentUser, useLogout } from '@/hooks';
import { Card, CardContent, CardHeader, Button, LoadingSpinner } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser();
  const logoutMutation = useLogout();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent>
          <p className="text-center text-gray-500">
            Please sign in to view your profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="text-gray-900">{user.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <p className="text-gray-900">{user.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Member Since</label>
          <p className="text-gray-900">{formatDate(user.createdAt)}</p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1">
            Edit Profile
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            loading={logoutMutation.isPending}
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
