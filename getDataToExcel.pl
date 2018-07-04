#!/Perl/bin/perl -w
###################################################################
### to create an empty table for optimum reports
###
###################################################################

my $DEBUG=0;
use strict;

my $dir = '/Users/alex/Documents/puppeteer/res/';
my $outfile = 'result.csv';
opendir(DIR, $dir) or die "cannot open directory $dir";
my @docs = grep(/-\d\d\.txt$/,readdir(DIR));
my %dates =();
my %intervals = ();
my %pairs = ();
my %files = @docs;
foreach my $file (@docs) {
	my ($pair, $coin, $curr, $int, $month, $day, $date) = '';
	if ($file =~ m!(\w{3,4})_(\w{3,4})_(\d{1,2}\w{1,})_(\d\d)-(\d\d)!) {
		$coin = $1;
		$curr = $2;
		$int = $3;
		$month = $4;
		$day = $5;
		$pair = $coin.'_'.$curr;
		$date = $month.'-'.$day;
		$pairs{$pair} = 1;
		$dates{$date} = 1;
	}
}
my @sorted_dates = sort(keys %dates);

my @intervals = qw(1m 5m 15m 30m);

#open(OUT, "> $outfile") || die "Can't open $outfile Code: $!";
#foreach my $pair (sort keys %pairs) {
##	print "$pair\n";
#	foreach my $int (@intervals) {
#		print OUT "$pair,mfi,$int,\n";
#		print OUT "$pair,bb,$int,\n";
#		print OUT "$pair,macd,$int,\n";
#	}
#}
#close(OUT);
#exit(0);
my %lines = ();
my %results = ();
open(IN, "< $outfile") || die "Can't open $outfile Code: $!";
while (my $line=<IN>) {
	chomp($line);
	$lines{$line} = 1;
}
close(IN);
foreach my $ln (sort keys %lines) {
	foreach my $dt (@sorted_dates) {
		my ($first, $sec, $third, @junk) = split(/,/, $ln);
#		print "$first\t$third\n";
		if ($sec =~ m!mfi!) {
			my $mfi_found = 0;
			my $infile = $first.'_'.$third.'_'.$dt.'.txt';
			open(IN, "< $dir$infile") || die "Can't open $dir$infile! Code: $!";
				while (my $line=<IN>) {
					if ($line =~ m!^Optimum for mfi: (\d{1,}) # ([\d.]{1,})!) {
						$ln = $ln."$dt,$1,".sprintf("%.2f", $2).',';
						$results{$ln} = 1;
						$mfi_found = 1;
					}
				}
			close(IN);
			if (!$mfi_found) {
				$ln = $ln."$dt,-,-,";
				$results{$ln} = 1;
			}
		}
		if ($sec =~ m!bb!) {
			my $bb_found = 0;
			my $infile = $first.'_'.$third.'_'.$dt.'.txt';
			open(IN, "< $dir$infile") || die "Can't open $dir$infile! Code: $!";
				while (my $line=<IN>) {
					if ($line =~ m!^Optimum for bb: ([\d., ]{1,}) # ([\d.]{1,})$!) {
						$ln = $ln."$dt,$1,".sprintf("%.2f", $2).',';
						$results{$ln} = 1;
						$bb_found = 1;
					}
				}
			close(IN);
			if (!$bb_found) {
				$ln = $ln."$dt,-,-,";
				$results{$ln} = 1;
			}
		}
		my $macd_found = 0;
		if ($sec =~ m!macd!) {
			my $infile = $first.'_'.$third.'_'.$dt.'.txt';
			open(IN, "< $dir$infile") || die "Can't open $dir$infile! Code: $!";
				while (my $line=<IN>) {
					if ($line =~ m!^Optimum for macd: ([\d., ]{1,}) # ([\d.]{1,})$!) {
						$ln = $ln."$dt,$1,".sprintf("%.2f", $2).',';
						$results{$ln} = 1;
						$macd_found = 1;
					}
				}
			close(IN);
			if (!$macd_found) {
				$ln = $ln."$dt,-,-,";
				$results{$ln} = 1;
			}
		}
	}
}
open(OUT, "> $outfile") || die "Can't open $outfile Code: $!";
foreach my $ln (sort keys %results) {
	print OUT "$ln\n";
}
close(OUT);
