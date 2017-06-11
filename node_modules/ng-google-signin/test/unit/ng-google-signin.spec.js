describe('googleSignIn Module specs', function () {
  var signedIn = false;

  // mocks
  var GoogleUserProfile = {
    getId: jasmine.createSpy().and.callFake(function() {
      return '123';
    }),
    getName: jasmine.createSpy().and.callFake(function() {
      return 'Bob Smith';
    }),
    getImageUrl: jasmine.createSpy().and.callFake(function() {
      return 'www.example.com/pic.jpg';
    }),
    getEmail: jasmine.createSpy().and.callFake(function() {
      return 'email@example.com';
    })
  };

  var GoogleUser = {
    getBasicProfile: jasmine.createSpy().and.callFake(function() {
      if(signedIn) {
        return GoogleUserProfile;
      } else {
        return null;
      }
    })
  };

  var GoogleAuth = {
    isSignedIn: {
      get: jasmine.createSpy().and.callFake(function() {
        return false;
      }),
      listen: jasmine.createSpy().and.callFake(function(cb) {
        cb();
      })
    },
    currentUser: {
      get: jasmine.createSpy().and.callFake(function() {
        return GoogleUser;
      }),
      listen: jasmine.createSpy().and.callFake(function(cb) {
        cb();
      })
    },
    then: jasmine.createSpy(),
    signIn: jasmine.createSpy().and.callFake(function() {
      return {
        then: function() {}
      };
    }),
    signOut: jasmine.createSpy().and.callFake(function() {
      return {
        then: function() {}
      };
    }),
    disconnect: jasmine.createSpy(),
    grantOfflineAccess: jasmine.createSpy().and.callFake(function() {
      return {
        then: function() {}
      };
    })
  };

  var auth2 = {
    init: jasmine.createSpy().and.callFake(function() {
      return GoogleAuth;
    }),
    GoogleAuth: GoogleAuth
  };

  window.gapi = {
    auth2: auth2,
    load: jasmine.createSpy().and.callFake(function(val, cb) {
      cb();
    })
  };

  var GoogleSignin, GoogleSigninProvider, $rootScope;

  beforeEach(function () {
    module('google-signin', function (_GoogleSigninProvider_) {
      GoogleSigninProvider = _GoogleSigninProvider_;
      GoogleSigninProvider.init({
        client_id: 'abc123'
      });
    });

    inject(function (_GoogleSignin_, _$rootScope_) {
      GoogleSignin = _GoogleSignin_;
      $rootScope = _$rootScope_;

      spyOn($rootScope, "$broadcast").and.callThrough();
      spyOn($rootScope, "$apply").and.callThrough();
    });

    window._startGoogleSignin();

    signedIn = false;
  });

  it('should exist', function () {
    expect(!!GoogleSigninProvider).toBeDefined();
  });

  describe('the provider api should provide', function () {

    describe("registered listeners", function() {
      it("for the current user", inject(function() {
        expect(GoogleAuth.currentUser.listen).toHaveBeenCalledWith(jasmine.any(Function));
      }));

      it("calls $broadcast for the current user", inject(function() {
        expect($rootScope.$broadcast).toHaveBeenCalled();
      }));

      it("calls $apply for the current user", inject(function() {
        expect($rootScope.$apply).toHaveBeenCalled();
      }));

      it("for the sign-in status", inject(function() {
        expect(GoogleAuth.isSignedIn.listen).toHaveBeenCalledWith(jasmine.any(Function));
      }));

      it("calls $broadcast for the sign-in status", inject(function() {
        expect($rootScope.$broadcast).toHaveBeenCalled();
      }));

      it("calls $apply for the sign-in status", inject(function() {
        expect($rootScope.$apply).toHaveBeenCalled();
      }));
    });

    describe("a working login", (function() {
      it("without options", inject(function() {
        expect(GoogleSignin.signIn().then).toEqual(jasmine.any(Function));

        expect(GoogleAuth.signIn).toHaveBeenCalledWith(undefined);
      }));

      it("with options", inject(function() {
        expect(GoogleSignin.signIn({
          client_id: 'xyz'
        }).then).toEqual(jasmine.any(Function));

        expect(GoogleAuth.signIn).toHaveBeenCalledWith({
          client_id: 'xyz'
        });
      }));
    }));

    it("a working logout", inject(function () {
      expect(GoogleSignin.signOut().then).toEqual(jasmine.any(Function));
      expect(GoogleAuth.signOut).toHaveBeenCalled();
    }));

    describe("a working offline access grant", function() {
      it("without options", inject(function() {
        expect(GoogleSignin.grantOfflineAccess().then).toEqual(jasmine.any(Function));

        expect(GoogleAuth.grantOfflineAccess).toHaveBeenCalledWith(undefined);
      }));

      it("with options", inject(function() {
        expect(GoogleSignin.grantOfflineAccess({
          client_id: 'xyz'
        }).then).toEqual(jasmine.any(Function));

        expect(GoogleAuth.grantOfflineAccess).toHaveBeenCalledWith({
          client_id: 'xyz'
        });
      }));
    });

    it('gets sign in status', inject(function() {
      expect(GoogleSignin.isSignedIn()).toEqual(false);
      expect(GoogleAuth.isSignedIn.get).toHaveBeenCalled();
    }));

    it("gets user", inject(function() {
      expect(GoogleSignin.getUser()).toEqual(GoogleUser);
      expect(GoogleAuth.currentUser.get).toHaveBeenCalled();
    }));

    describe("gets basic profile", function() {
      it("when signed in", inject(function() {
        signedIn = true;
        var profile = GoogleSignin.getBasicProfile();

        expect(GoogleUser.getBasicProfile).toHaveBeenCalled();
        expect(GoogleUserProfile.getId).toHaveBeenCalled();
        expect(GoogleUserProfile.getName).toHaveBeenCalled();
        expect(GoogleUserProfile.getImageUrl).toHaveBeenCalled();
        expect(GoogleUserProfile.getEmail).toHaveBeenCalled();

        expect(profile).toEqual({
          id: '123',
          name: 'Bob Smith',
          image: 'www.example.com/pic.jpg',
          email: 'email@example.com'
        });
      }));

      it("when signed out", inject(function() {
        signedIn = false;
        var profile = GoogleSignin.getBasicProfile();

        expect(profile).toBe(null);
      }));
    });

    it("disconnects the user", inject(function() {
      GoogleSignin.disconnect();

      expect(GoogleAuth.disconnect).toHaveBeenCalled();
    }));

    it('client id as default value', function () {
      expect(GoogleSigninProvider.getClientId()).toBe('abc123');
    });

    it('scopes as default value', function () {
      expect(GoogleSigninProvider.getScopes()).toEqual(['profile', 'email']);
    });

    it('working getter / setter for client id', function () {
      GoogleSigninProvider.setClientId('xyz');
      expect(GoogleSigninProvider.getClientId()).toEqual('xyz');
    });

    it('working getter / setter for cookie policy', function () {
      GoogleSigninProvider.setCookiePolicy('none');
      expect(GoogleSigninProvider.getCookiePolicy()).toEqual('none');
    });

    it('working getter / setter for fetch basic profile', function () {
      GoogleSigninProvider.setFetchBasicProfile(false);
      expect(GoogleSigninProvider.getFetchBasicProfile()).toEqual(false);
    });

    it('working getter / setter for hosted domain', function () {
      GoogleSigninProvider.setHostedDomain('example.com');
      expect(GoogleSigninProvider.getHostedDomain()).toEqual('example.com');
    });

    it('working getter / setter for OpenID Realm', function () {
      GoogleSigninProvider.setOpenIDRealm('example.com');
      expect(GoogleSigninProvider.getOpenIDRealm()).toEqual('example.com');
    });

    it('working getter / setter for scope', function () {
      GoogleSigninProvider.setScopes(['profile', 'contacts']);
      expect(GoogleSigninProvider.getScopes()).toEqual(['profile', 'contacts']);
    });
  });
});