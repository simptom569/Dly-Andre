from rest_framework import serializers


from .models import User

class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('login', 'email', 'password', 'firstName', 'lastName', 'last_login', 'registered')

    def validate(self, attrs):
        return super().validate(attrs)

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user